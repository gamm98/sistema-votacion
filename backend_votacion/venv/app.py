# app.py (fragmento principal — copia/pega reemplazando parte relevante)
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_wtf.csrf import CSRFProtect
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required,
    get_jwt_identity, get_jwt
)
import cv2, numpy as np, os, tempfile, smtplib
from datetime import datetime, timedelta
from io import BytesIO
from email.message import EmailMessage
from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import ImageReader
from reportlab.lib import colors
from reportlab.platypus import Table, TableStyle
import bleach
from reportlab.pdfgen import canvas
import matplotlib.pyplot as plt
import io

# -------------------- CONFIGURACIÓN BASE --------------------
app = Flask(__name__)
#-------------------- CSRF (Cross-Site Request Forgery) --------------------
app.config['SECRET_KEY'] = 'supersecretkey'
csrf=CSRFProtect(app)

CORS(app, resources={r"/api/*": {"origins": "https://localhost:3000"}}, supports_credentials=True)

app.config['SQLALCHEMY_DATABASE_URI'] = "mysql+pymysql://root:@localhost:3306/votacion_db"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config["JWT_SECRET_KEY"] = "utp2025"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=30)
jwt = JWTManager(app)
db = SQLAlchemy(app)

# -------------------- MODELOS --------------------
class User(db.Model):
    __tablename__ = "users"
    dni = db.Column(db.String(8), primary_key=True)
    nombre = db.Column(db.String(100))
    ya_voto = db.Column(db.Boolean, default=False)

class Vote(db.Model):
    __tablename__ = "votes"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    dni = db.Column(db.String(8), nullable=False)
    candidato = db.Column(db.String(100), nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.now)

# -------------------- VALIDACIÓN FACIAL --------------------
FACES_DIR = os.path.join(os.getcwd(), "faces")
os.makedirs(FACES_DIR, exist_ok=True)

def obtener_base_path(dni):
    for ext in (".jpg", ".png"):
        path = os.path.join(FACES_DIR, f"{dni}{ext}")
        if os.path.exists(path):
            return path
    return None

def validar_rostro_simple(dni, imagen_capturada_path):
    base_path = obtener_base_path(dni)
    if not base_path:
        return False, f"No existe una imagen registrada para el DNI {dni}"

    img_base = cv2.imread(base_path, cv2.IMREAD_COLOR)
    img_captura = cv2.imread(imagen_capturada_path, cv2.IMREAD_COLOR)
    if img_base is None or img_captura is None:
        return False, "Error al cargar las imágenes."

    img_base_gray = cv2.cvtColor(img_base, cv2.COLOR_BGR2GRAY)
    img_captura_gray = cv2.cvtColor(img_captura, cv2.COLOR_BGR2GRAY)
    img_captura_gray = cv2.resize(img_captura_gray, (img_base_gray.shape[1], img_base_gray.shape[0]))
    diferencia = cv2.absdiff(img_base_gray, img_captura_gray)
    similitud = 1 - (np.mean(diferencia) / 255)

    return (True, f"Rostro validado correctamente ({similitud*100:.2f}% de similitud)") if similitud > 0.65 else (False, f"Rostro no coincide ({similitud*100:.2f}% de similitud)")
# -------------------- VERIFICAR QUE EL BACK FUNCIONA --------------------
@app.route("/")
def home():
    return "✅ Servidor Flask funcionando con SSL"

# -------------------- LOGIN USUARIO --------------------
@csrf.exempt
@app.route("/api/login", methods=["POST"])
def login():
    dni = bleach.clean(request.form.get("dni","").strip())
    imagen = request.files.get("imagen")

    if not dni or not imagen:
        return jsonify({"success": False, "message": "Faltan datos: DNI o imagen."}), 400
    if not dni.isdigit() or len(dni) != 8:
        return jsonify({"success": False, "message": "El DNI debe tener 8 dígitos."}), 400
    #Limpiar texto si hay contenido
    #dni = bleach.clean(dni).strip()

    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tf:
        imagen.save(tf.name)
        temp_path = tf.name

    valido, mensaje = validar_rostro_simple(dni, temp_path)
    os.remove(temp_path)

    if not valido:
        return jsonify({"success": False, "message": mensaje}), 400

    user = User.query.filter_by(dni=dni).first()
    if not user:
        return jsonify({"success": False, "message": "Usuario no registrado"}), 400
    if user.ya_voto:
        return jsonify({"success": False, "message": "El usuario ya votó"}), 400

    access_token = create_access_token(identity=dni)
    return jsonify({"success": True, "token": access_token, "nombre": user.nombre, "message": mensaje})

# -------------------- LOGIN ADMIN --------------------
@csrf.exempt    
@app.route("/api/admin/login", methods=["POST"])
def admin_login():
    data = request.get_json()
    usuario = data.get("usuario")
    contrasena = data.get("contrasena")

    if not usuario or not contrasena:
        return jsonify({"success": False, "message": "Debe ingresar usuario y contraseña"}), 400

    admin = db.session.execute(db.text(
        "SELECT * FROM admin WHERE usuario = :usuario AND contrasena = :contrasena"
    ), {"usuario": usuario, "contrasena": contrasena}).fetchone()

    if not admin:
        return jsonify({"success": False, "message": "Credenciales inválidas"}), 401

    token = create_access_token(identity=usuario, additional_claims={"rol": "admin"})
    return jsonify({"success": True, "token": token, "message": "Acceso concedido"}), 200

# -------------------- RESULTADOS ADMIN --------------------
@app.route("/api/admin/results", methods=["GET"])
@jwt_required()
def admin_results():
    claims = get_jwt()
    if claims.get("rol") != "admin":
        return jsonify({"success": False, "message": "Acceso denegado"}), 403

    votes = db.session.execute(db.text(
        "SELECT candidato, COUNT(*) as total FROM votes GROUP BY candidato"
    )).fetchall()
    resultados = [{"candidato": v.candidato, "total": v.total} for v in votes]
    return jsonify({"success": True, "data": resultados})

# -------------------- GENERAR PDF DE RESULTADOS --------------------
def generar_pdf_resultados():
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    # --- Logo ---
    logo_path = os.path.join("imagenes", "votewise.png")
    if os.path.exists(logo_path):
        pdf.drawImage(logo_path, 40, height - 90, width=100, height=50, mask="auto")

    # --- Encabezado ---
    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawString(180, height - 60, "UNIVERSIDAD TECNOLÓGICA DEL PERÚ")
    pdf.setFont("Helvetica", 12)
    pdf.drawString(210, height - 80, "Facultad de Ingeniería de Software")

    # --- Título ---
    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawString(200, height - 120, "REPORTE DE RESULTADOS DE VOTACIÓN")
    pdf.line(150, height - 125, 460, height - 125)

    pdf.setFont("Helvetica", 10)
    fecha_actual = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    pdf.drawString(400, height - 140, f"Generado: {fecha_actual}")

    # --- Datos de BD ---
    resultados = db.session.execute(db.text(
        "SELECT candidato, COUNT(*) as total FROM votes GROUP BY candidato"
    )).fetchall()

    data = [["Candidato", "Votos"]]
    candidatos, votos = [], []
    total_votos = 0

    for r in resultados:
        data.append([r.candidato, str(r.total)])
        candidatos.append(r.candidato)
        votos.append(r.total)
        total_votos += r.total

    data.append(["TOTAL", str(total_votos)])

    table = Table(data, colWidths=[300, 100])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1E3A8A")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ('BACKGROUND', (0, 1), (-1, -2), colors.beige),
        ('BACKGROUND', (0, -1), (-1, -1), colors.lightgrey),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey)
    ]))

    table.wrapOn(pdf, width, height)
    table.drawOn(pdf, 120, height - 350)

    # --- Gráfico circular ---
    if total_votos > 0:
        plt.figure(figsize=(4, 4))
        plt.pie(votos, labels=candidatos, autopct="%1.1f%%", startangle=140)
        plt.title("Distribución de votos por candidato")
        chart_path = os.path.join("imagenes", "grafico_resultados.png")
        plt.savefig(chart_path, bbox_inches="tight", transparent=True)
        plt.close()

        if os.path.exists(chart_path):
            pdf.drawImage(chart_path, 150, height - 650, width=300, height=250, mask="auto")
            os.remove(chart_path)

    pdf.setFont("Helvetica-Oblique", 9)
    pdf.drawString(50, 50, "Sistema de Votación Segura © Proyecto académico UTP 2025")
    pdf.drawString(400, 50, "Desarrollado por Gianmarco Medina")

    pdf.showPage()
    pdf.save()
    buffer.seek(0)
    return buffer

# -------------------- EXPORTAR RESULTADOS Y ENVIAR POR CORREO --------------------
@csrf.exempt    
@app.route("/api/admin/send_report", methods=["POST"])
@jwt_required()
def send_report():
    claims = get_jwt()
    if claims.get("rol") != "admin":
        return jsonify({"success": False, "message": "Acceso denegado"}), 403

    # 🔹 Obtener resultados de la base de datos
    votes = db.session.execute(db.text(
        "SELECT candidato, COUNT(*) as total FROM votes GROUP BY candidato"
    )).fetchall()

    if not votes:
        return jsonify({"success": False, "message": "No hay votos registrados."}), 400

    resultados = {v.candidato: v.total for v in votes}
    total_votos = sum(resultados.values())

    # 🔹 Generar gráfico de barras y pastel con Matplotlib
    candidatos = list(resultados.keys())
    totales = list(resultados.values())

    # Gráfico de barras
    plt.figure(figsize=(6, 4))
    plt.bar(candidatos, totales, color=['#3b82f6', '#10b981', '#f59e0b', '#ef4444'])
    plt.title("Distribución de votos por candidato")
    plt.xlabel("Candidatos")
    plt.ylabel("Votos")
    plt.xticks(rotation=20)
    barras_buffer = io.BytesIO()
    plt.tight_layout()
    plt.savefig(barras_buffer, format='png')
    barras_buffer.seek(0)
    plt.close()

    # Gráfico circular
    plt.figure(figsize=(5, 5))
    plt.pie(totales, labels=candidatos, autopct='%1.1f%%', colors=['#3b82f6', '#10b981', '#f59e0b', '#ef4444'])
    plt.title("Porcentaje total de votos")
    pastel_buffer = io.BytesIO()
    plt.savefig(pastel_buffer, format='png')
    pastel_buffer.seek(0)
    plt.close()

    # 🔹 Crear PDF temporal con ReportLab
    pdf_path = os.path.join(tempfile.gettempdir(), "reporte_votacion.pdf")
    c = canvas.Canvas(pdf_path, pagesize=letter)
    width, height = letter

    # --- Logo ---
    logo_path = os.path.join(os.getcwd(), "imagenes", "votewise.png")
    if os.path.exists(logo_path):
        c.drawImage(ImageReader(logo_path), 50, height - 120, width=120, height=80, mask='auto')

    # --- Título ---
    c.setFont("Helvetica-Bold", 16)
    c.drawString(200, height - 60, "REPORTE DE RESULTADOS - VOTEWISE")
    c.setFont("Helvetica", 12)
    c.drawString(50, height - 140, f"Generado el: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")

    # --- Tabla de resultados ---
    y = height - 180
    c.drawString(50, y, "CANDIDATO")
    c.drawString(350, y, "VOTOS")
    c.line(50, y - 5, 550, y - 5)
    y -= 25
    for candidato, total in resultados.items():
        c.drawString(50, y, candidato)
        c.drawString(350, y, str(total))
        y -= 20
    c.line(50, y - 5, 550, y - 5)
    y -= 25
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y, f"TOTAL GENERAL: {total_votos}")
    y -= 40

    # --- Insertar gráficos ---
    c.drawImage(ImageReader(barras_buffer), 50, y - 230, width=500, height=200)
    y -= 260
    c.drawImage(ImageReader(pastel_buffer), 150, y - 250, width=300, height=250)
    c.showPage()
    c.save()

    # 🔹 Envío del correo
    destinatario = "gianmarcomija2015@gmail.com"
    remitente = "gianmarcomija2015@gmail.com"
    password = "ggjo yqmk opvo dstr"

    msg = EmailMessage()
    msg["Subject"] = "📊 Reporte de resultados de votación - VoteWise"
    msg["From"] = remitente
    msg["To"] = destinatario
    msg.set_content(
        "Estimado administrador,\n\nAdjunto encontrarás el reporte detallado de los resultados de votación.\n\nAtentamente,\nEl sistema VoteWise"
    )

    with open(pdf_path, "rb") as f:
        msg.add_attachment(f.read(), maintype="application", subtype="pdf", filename="reporte_votacion.pdf")

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(remitente, password)
            smtp.send_message(msg)
        return jsonify({
            "success": True,
            "message": f"📨 Reporte enviado exitosamente al correo {destinatario}."
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"❌ Error al enviar correo: {str(e)}"
        }), 500

# -------------------- VOTAR --------------------
@csrf.exempt    
@app.route("/api/vote", methods=["POST"])
@jwt_required()
def vote():
    identity = get_jwt_identity()
    data = request.get_json() or request.form
    candidato = data.get("candidato")

    if not candidato:
        return jsonify({"success": False, "message": "Falta el candidato"}), 400

    user = User.query.filter_by(dni=identity).first()
    if not user:
        return jsonify({"success": False, "message": "Usuario no registrado"}), 400
    if user.ya_voto:
        return jsonify({"success": False, "message": "Usuario ya votó"}), 400

    new_vote = Vote(dni=identity, candidato=candidato)
    db.session.add(new_vote)
    user.ya_voto = True
    db.session.commit()
    return jsonify({"success": True, "message": "Voto registrado correctamente"})

# -------------------- RESULTADOS --------------------
@app.route("/api/results", methods=["GET"])
@jwt_required()
def results():
    votes = Vote.query.all()
    conteo = {}
    for v in votes:
        conteo[v.candidato] = conteo.get(v.candidato, 0) + 1
    return jsonify(conteo)

# -------------------- MAIN --------------------
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
app.run(debug=True, ssl_context=('C:\\Users\\PC\\ssl\\cert.pem', 'C:\\Users\\PC\\ssl\\key.pem'))

