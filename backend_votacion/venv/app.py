from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import cv2
import numpy as np
import os
import base64
import tempfile
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import smtplib
from email.message import EmailMessage
from datetime import datetime

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

# Ruta de imágenes de rostros
FACES_DIR = os.path.join(os.getcwd(), "faces")
if not os.path.exists(FACES_DIR):
    os.makedirs(FACES_DIR)

# --------------------------------------------------------------------
# FUNCIÓN DE VALIDACIÓN FACIAL (la misma que tenías)
# --------------------------------------------------------------------
def validar_rostro_simple(dni, imagen_capturada_path):
    base_path_jpg = os.path.join(FACES_DIR, f"{dni}.jpg")
    base_path_png = os.path.join(FACES_DIR, f"{dni}.png")

    if os.path.exists(base_path_jpg):
        base_path = base_path_jpg
    elif os.path.exists(base_path_png):
        base_path = base_path_png
    else:
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

    if similitud > 0.65:
        return True, f"Rostro validado correctamente ({similitud*100:.2f}% de similitud)"
    else:
        return False, f"Rostro no coincide ({similitud*100:.2f}% de similitud)"

# --------------------------------------------------------------------
# LOGIN FACIAL
# --------------------------------------------------------------------
@app.route("/api/login", methods=["POST"])
def login():
    dni = request.form.get("dni")
    imagen = request.files.get("imagen")

    if not dni or not imagen:
        return jsonify({"success": False, "message": "Faltan datos: DNI o imagen."}), 400

    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp_file:
        imagen.save(temp_file.name)
        temp_path = temp_file.name

    valido, mensaje = validar_rostro_simple(dni, temp_path)

    if os.path.exists(temp_path):
        os.remove(temp_path)

    if valido:
        return jsonify({"success": True, "message": mensaje})
    else:
        return jsonify({"success": False, "message": mensaje}), 400

# --------------------------------------------------------------------
# GENERAR REPORTE PDF (resultados)
# --------------------------------------------------------------------
@app.route("/api/reporte/pdf", methods=["GET"])
def generar_reporte_pdf():
    # Simulación de datos de votación (esto luego lo conectas con MySQL)
    resultados = [
        {"candidato": "Candidato A", "votos": 120},
        {"candidato": "Candidato B", "votos": 95},
        {"candidato": "Candidato C", "votos": 60},
    ]

    total_votos = sum(r["votos"] for r in resultados)

    # Crear archivo PDF temporal
    pdf_path = os.path.join(tempfile.gettempdir(), f"reporte_votacion_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf")

    c = canvas.Canvas(pdf_path, pagesize=letter)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(200, 750, "Reporte de Resultados de Votación")

    c.setFont("Helvetica", 12)
    y = 700
    for r in resultados:
        porcentaje = (r["votos"] / total_votos) * 100
        c.drawString(100, y, f"{r['candidato']}: {r['votos']} votos ({porcentaje:.2f}%)")
        y -= 25

    c.drawString(100, y - 10, f"Total de votos: {total_votos}")
    c.drawString(100, y - 40, f"Fecha de generación: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    c.save()

    return send_file(pdf_path, as_attachment=True, download_name="reporte_votacion.pdf")

# --------------------------------------------------------------------
# ENVIAR REPORTE POR CORREO
# --------------------------------------------------------------------
@app.route("/api/reporte/email", methods=["POST"])
def enviar_reporte_email():
    email_destino = request.form.get("email")

    if not email_destino:
        return jsonify({"success": False, "message": "Debe proporcionar un correo destino."}), 400

    # Primero generamos el PDF
    pdf_path = os.path.join(tempfile.gettempdir(), "reporte_votacion_envio.pdf")
    c = canvas.Canvas(pdf_path, pagesize=letter)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(200, 750, "Reporte de Resultados de Votación")
    c.setFont("Helvetica", 12)
    c.drawString(100, 700, "Candidato A: 120 votos (46.15%)")
    c.drawString(100, 675, "Candidato B: 95 votos (36.54%)")
    c.drawString(100, 650, "Candidato C: 60 votos (17.31%)")
    c.drawString(100, 600, f"Enviado el {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    c.save()

    # Configuración SMTP
    remitente = "gianmarcomija2015@gmail.com"   # <---- CAMBIA ESTO
    contraseña = "zukr pdqs vpzl bkbz"   # <---- CONTRASEÑA DE APLICACIÓN GMAIL

    msg = EmailMessage()
    msg["Subject"] = "Reporte de Resultados de Votación"
    msg["From"] ="Sistema de Votación" + remitente
    msg["To"] = email_destino
    msg.set_content("Adjunto encontrarás el reporte PDF con los resultados de votación.")

    with open(pdf_path, "rb") as f:
        msg.add_attachment(f.read(), maintype="application", subtype="pdf", filename="reporte_votacion.pdf")

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(remitente, contraseña)
            smtp.send_message(msg)

        return jsonify({"success": True, "message": f"Reporte enviado correctamente a {email_destino}."})
    except Exception as e:
        return jsonify({"success": False, "message": f"Error al enviar correo: {e}"}), 500

# --------------------------------------------------------------------
@app.route("/")
def home():
    return "✅ Backend de votación con validación facial + generación y envío de reportes PDF."


if __name__ == "__main__":
    app.run(debug=True)
