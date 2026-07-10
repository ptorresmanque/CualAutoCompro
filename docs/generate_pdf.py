#!/usr/bin/env python3
"""Genera el PDF con la guia de despliegue del proyecto cualautocompro en cPanel.

Adaptado a MariaDB 10.5+ (provider = "mysql" en Prisma) con utf8mb4 obligatorio.
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.enums import TA_LEFT, TA_JUSTIFY, TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    Preformatted, ListFlowable, ListItem
)

OUTPUT = "/Users/patriciomanquepillan/Documents/dev/testSuperpowers/docs/guia-despliegue-cpanel.pdf"

# --- Estilos ---
styles = getSampleStyleSheet()

PRIMARY    = HexColor("#1e3a8a")
ACCENT     = HexColor("#0ea5e9")
DARK       = HexColor("#0f172a")
LIGHT_BG   = HexColor("#f1f5f9")
CODE_BG    = HexColor("#0f172a")
CODE_FG    = HexColor("#e2e8f0")
WARN_BG    = HexColor("#fef3c7")
WARN_BORDER= HexColor("#f59e0b")
INFO_BG    = HexColor("#dbeafe")
INFO_BORDER= HexColor("#3b82f6")
DANGER_BG  = HexColor("#fee2e2")
DANGER_BORDER= HexColor("#ef4444")
SUCCESS_BG = HexColor("#d1fae5")
SUCCESS_BORDER= HexColor("#10b981")

styles.add(ParagraphStyle(name="Titulo", parent=styles["Title"], fontSize=28, leading=34,
    textColor=PRIMARY, spaceAfter=14, alignment=TA_CENTER, fontName="Helvetica-Bold"))
styles.add(ParagraphStyle(name="Subtitulo", parent=styles["Normal"], fontSize=14, leading=18,
    textColor=DARK, spaceAfter=24, alignment=TA_CENTER, fontName="Helvetica-Oblique"))
styles.add(ParagraphStyle(name="H1", parent=styles["Heading1"], fontSize=20, leading=24,
    textColor=PRIMARY, spaceBefore=10, spaceAfter=10, fontName="Helvetica-Bold"))
styles.add(ParagraphStyle(name="H2", parent=styles["Heading2"], fontSize=15, leading=20,
    textColor=PRIMARY, spaceBefore=14, spaceAfter=6, fontName="Helvetica-Bold"))
styles.add(ParagraphStyle(name="H3", parent=styles["Heading3"], fontSize=12, leading=16,
    textColor=DARK, spaceBefore=10, spaceAfter=4, fontName="Helvetica-Bold"))
styles.add(ParagraphStyle(name="Cuerpo", parent=styles["BodyText"], fontSize=10.5, leading=14,
    textColor=DARK, alignment=TA_JUSTIFY, spaceAfter=6))
styles.add(ParagraphStyle(name="MiBullet", parent=styles["BodyText"], fontSize=10.5, leading=14,
    leftIndent=18, bulletIndent=6, textColor=DARK, spaceAfter=4, alignment=TA_LEFT))
styles.add(ParagraphStyle(name="MiCode", parent=styles["Code"], fontSize=9, leading=12,
    textColor=CODE_FG, backColor=CODE_BG, leftIndent=6, rightIndent=6,
    spaceBefore=4, spaceAfter=4, fontName="Courier"))
styles.add(ParagraphStyle(name="Caption", parent=styles["Normal"], fontSize=9, leading=12,
    textColor=HexColor("#475569"), alignment=TA_CENTER, fontName="Helvetica-Oblique", spaceAfter=10))


def header_footer(canvas_obj, doc):
    canvas_obj.saveState()
    width, height = A4
    canvas_obj.setStrokeColor(PRIMARY)
    canvas_obj.setLineWidth(0.8)
    canvas_obj.line(2*cm, height - 1.4*cm, width - 2*cm, height - 1.4*cm)
    canvas_obj.setFont("Helvetica-Bold", 9)
    canvas_obj.setFillColor(PRIMARY)
    canvas_obj.drawString(2*cm, height - 1.2*cm, "cualautocompro")
    canvas_obj.setFont("Helvetica", 9)
    canvas_obj.setFillColor(HexColor("#475569"))
    canvas_obj.drawRightString(width - 2*cm, height - 1.2*cm,
                               "Guia de despliegue en hosting cPanel - MariaDB")
    canvas_obj.setStrokeColor(HexColor("#cbd5e1"))
    canvas_obj.line(2*cm, 1.4*cm, width - 2*cm, 1.4*cm)
    canvas_obj.setFont("Helvetica", 8)
    canvas_obj.setFillColor(HexColor("#475569"))
    canvas_obj.drawString(2*cm, 1.1*cm, "Stack: Angular 22 + Node.js/Express + Prisma + MariaDB 10.5+")
    canvas_obj.drawRightString(width - 2*cm, 1.1*cm, f"Pagina {doc.page}")
    canvas_obj.restoreState()


def portada(canvas_obj, doc):
    canvas_obj.saveState()
    width, height = A4
    canvas_obj.setFillColor(PRIMARY)
    canvas_obj.rect(0, height - 12*cm, width, 12*cm, stroke=0, fill=1)
    canvas_obj.setFillColor(ACCENT)
    canvas_obj.rect(0, height - 12.6*cm, width, 0.6*cm, stroke=0, fill=1)
    canvas_obj.setFillColor(white)
    canvas_obj.setFont("Helvetica-Bold", 36)
    canvas_obj.drawCentredString(width/2, height - 5*cm, "cualautocompro")
    canvas_obj.setFont("Helvetica", 18)
    canvas_obj.drawCentredString(width/2, height - 6.5*cm, "Guia de despliegue en hosting cPanel")
    canvas_obj.setFont("Helvetica-Oblique", 12)
    canvas_obj.drawCentredString(width/2, height - 7.7*cm,
                                 "Angular 22 + Node.js/Express + Prisma + MariaDB 10.5+")
    canvas_obj.setFillColor(DARK)
    canvas_obj.setFont("Helvetica-Bold", 11)
    canvas_obj.drawString(2*cm, 6*cm, "Stack del proyecto")
    canvas_obj.setFont("Helvetica", 10)
    contenido = [
        "apps/frontend  - Aplicacion Angular 22 (SPA)",
        "apps/backend   - API REST en Node.js + Express + Prisma",
        "Base de datos  - MariaDB 10.5+ (charset utf8mb4 obligatorio)",
        "Monorepo       - npm workspaces",
        "Enums          - Reemplazados por String + constantes validadas",
    ]
    y = 5.2*cm
    for linea in contenido:
        canvas_obj.drawString(2.4*cm, y, "- " + linea)
        y -= 0.55*cm
    canvas_obj.setStrokeColor(PRIMARY)
    canvas_obj.setLineWidth(0.6)
    canvas_obj.line(2*cm, 4*cm, width - 2*cm, 4*cm)
    canvas_obj.setFont("Helvetica-Oblique", 9)
    canvas_obj.setFillColor(HexColor("#475569"))
    canvas_obj.drawString(2*cm, 3.4*cm,
        "Esta guia describe paso a paso como desplegar el proyecto completo")
    canvas_obj.drawString(2*cm, 3*cm,
        "en un hosting con cPanel, incluyendo consideraciones criticas")
    canvas_obj.drawString(2*cm, 2.6*cm,
        "sobre Node.js y MariaDB con utf8mb4 obligatorio.")
    canvas_obj.restoreState()


def code_block(text):
    tbl = Table([[Preformatted(text, styles["MiCode"])]], colWidths=[16.4*cm])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), CODE_BG),
        ("LEFTPADDING", (0,0), (-1,-1), 10),
        ("RIGHTPADDING", (0,0), (-1,-1), 10),
        ("TOPPADDING", (0,0), (-1,-1), 8),
        ("BOTTOMPADDING", (0,0), (-1,-1), 8),
        ("BOX", (0,0), (-1,-1), 0.5, HexColor("#1e293b")),
    ]))
    return tbl


def callout(text, kind="info"):
    palette = {
        "info":    (INFO_BG,    INFO_BORDER,    "INFORMACION"),
        "warn":    (WARN_BG,    WARN_BORDER,    "IMPORTANTE"),
        "danger":  (DANGER_BG,  DANGER_BORDER,  "ADVERTENCIA"),
        "success": (SUCCESS_BG, SUCCESS_BORDER, "CONSEJO"),
    }
    bg, border, tag = palette[kind]
    p = Paragraph(f"<b>{text}</b>", ParagraphStyle("callout", parent=styles["BodyText"],
        fontSize=10, leading=13, textColor=DARK, alignment=TA_LEFT))
    tbl = Table([[p]], colWidths=[16.4*cm])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), bg),
        ("LEFTPADDING", (0,0), (-1,-1), 12),
        ("RIGHTPADDING", (0,0), (-1,-1), 12),
        ("TOPPADDING", (0,0), (-1,-1), 8),
        ("BOTTOMPADDING", (0,0), (-1,-1), 8),
        ("LINEBEFORE", (0,0), (0,-1), 4, border),
        ("BOX", (0,0), (-1,-1), 0.4, border),
    ]))
    return tbl


def bullets(items, style="MiBullet"):
    return ListFlowable(
        [ListItem(Paragraph(t, styles[style]), leftIndent=18, value="bullet") for t in items],
        bulletType="bullet", bulletColor=PRIMARY, bulletFontSize=9,
        leftIndent=22, bulletOffsetY=-1, spaceBefore=2, spaceAfter=8)


def numbered(items):
    return ListFlowable(
        [ListItem(Paragraph(t, styles["Cuerpo"]), leftIndent=24) for t in items],
        bulletType="1", bulletColor=PRIMARY, bulletFontName="Helvetica-Bold",
        leftIndent=28, spaceBefore=4, spaceAfter=10)


# --- Contenido ---
story = []

# PORTADA
story.append(Spacer(1, 16*cm))
story.append(Paragraph("<font color='white'>.</font>", styles["Normal"]))
story.append(PageBreak())

# INDICE
story.append(Paragraph("Indice", styles["H1"]))
for item in [
    "1. Vision general y requisitos",
    "2. Consideraciones criticas antes de empezar",
    "3. Preparacion local del proyecto",
    "4. Configuracion de la base de datos MariaDB",
    "5. Despliegue del backend Node.js en cPanel",
    "6. Despliegue del frontend Angular",
    "7. Configuracion de SSL y dominio",
    "8. Verificacion final y monitoreo",
    "9. Problemas frecuentes",
    "10. Alternativas recomendadas",
    "11. Login social con Google y Apple (OAuth 2.0 / OIDC)",
]:
    story.append(Paragraph(item, styles["Cuerpo"]))
story.append(PageBreak())

# 1. VISION GENERAL
story.append(Paragraph("1. Vision general y requisitos", styles["H1"]))
story.append(Paragraph(
    "El proyecto <b>cualautocompro</b> es un monorepo con dos aplicaciones: un frontend "
    "Angular 22 (SPA) que se sirve como archivos estaticos, y un backend Node.js/Express "
    "que expone una API REST con Prisma sobre <b>MariaDB 10.5+</b> (provider = 'mysql' en el schema).",
    styles["Cuerpo"]))

story.append(Paragraph("Arquitectura objetivo en cPanel", styles["H2"]))
diag = Table([[
    Paragraph("<b>Visitante</b><br/>Navegador", styles["Cuerpo"]),
    Paragraph("<b>Frontend Angular</b><br/>Archivos estaticos<br/>Apache en public_html", styles["Cuerpo"]),
    Paragraph("<b>Backend Node.js</b><br/>API REST (Express)<br/>Puerto interno", styles["Cuerpo"]),
    Paragraph("<b>MariaDB 10.5+</b><br/>utf8mb4 obligatorio<br/>Prisma ORM", styles["Cuerpo"]),
]], colWidths=[3.5*cm, 4.5*cm, 4.2*cm, 4.2*cm])
diag.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (0,0), HexColor("#dbeafe")),
    ("BACKGROUND", (1,0), (1,0), HexColor("#dcfce7")),
    ("BACKGROUND", (2,0), (2,0), HexColor("#fef9c3")),
    ("BACKGROUND", (3,0), (3,0), HexColor("#fee2e2")),
    ("BOX", (0,0), (-1,-1), 0.5, HexColor("#475569")),
    ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ("ALIGN", (0,0), (-1,-1), "CENTER"),
    ("TOPPADDING", (0,0), (-1,-1), 10),
    ("BOTTOMPADDING", (0,0), (-1,-1), 10),
]))
story.append(diag)
story.append(Spacer(1, 0.4*cm))

story.append(Paragraph("Requisitos del lado del cliente", styles["H2"]))
story.append(bullets([
    "Computadora con Node.js 20+ y npm 10+ (incluido con Node 20).",
    "Acceso al panel cPanel (URL, usuario y contrasena).",
    "Cliente MariaDB local o acceso a phpMyAdmin para preparar la BD.",
    "Cliente FTP o acceso al Administrador de archivos de cPanel.",
    "Dominio configurado apuntando a los DNS del hosting.",
]))

story.append(Paragraph("Requisitos del lado del hosting", styles["H2"]))
story.append(bullets([
    "Plan cPanel con soporte para aplicaciones Node.js ('Setup Node.js App').",
    "MariaDB 10.5+ o MySQL 8+ (MariaDB es lo habitual en cPanel compartido).",
    "Acceso SSH (recomendado) o Terminal desde el Administrador de archivos.",
    "Al menos 1 GB de espacio libre para node_modules y builds.",
]))
story.append(PageBreak())

# 2. CONSIDERACIONES CRITICAS
story.append(Paragraph("2. Consideraciones criticas antes de empezar", styles["H1"]))
story.append(callout(
    "MariaDB 10.5+ es lo habitual en cPanel y es lo que usa este proyecto. "
    "No use MySQL 5.7 (no soporta JSON nativo con la sintaxis que Prisma necesita). "
    "Verifique con su proveedor la version exacta del servidor MariaDB.",
    kind="danger"))

story.append(Paragraph("Limitaciones habituales en cPanel compartido", styles["H2"]))
story.append(bullets([
    "<b>Node.js</b>: solo en planes con 'Setup Node.js App' o 'Node.js Selector'. "
    "En compartido suele estar limitado a 1-2 aplicaciones.",
    "<b>MariaDB remoto</b>: la mayoria de proveedores no expone el puerto 3306 hacia afuera; "
    "el backend debe correr en el mismo servidor.",
    "<b>Procesos persistentes</b>: el backend Node.js se gestiona desde 'Application Manager'.",
    "<b>Memoria/CPU</b>: el build de Angular puede requerir mas de lo que ofrece el compartido.",
    "<b>SSL</b>: use Let's Encrypt disponible de forma gratuita en cPanel.",
]))

story.append(Paragraph("Especificidades de MariaDB que aplican al proyecto", styles["H2"]))
story.append(bullets([
    "<b>Charset utf8mb4 obligatorio</b>: el schema Prisma incluye caracteres Unicode (emojis, "
    "tilde, enie). El CREATE DATABASE y la URL deben especificar <i>charset=utf8mb4</i>.",
    "<b>ENUM no se usa en el schema</b>: los enums de Prisma (Segment, Fuel, etc.) generan "
    "columnas inline ENUM(...) en MariaDB que no se pueden extender en runtime. El proyecto "
    "usa <b>String + constantes</b> validadas en services (SEGMENTS, FUELS, TRANSMISSIONS).",
    "<b>galleryUrls es columna JSON</b>: ya no es String[] (que MariaDB no soporta nativamente); "
    "se serializa como JSON y se normaliza en services con <i>toGalleryUrls</i>.",
    "<b>ANSI_QUOTES</b>: el proyecto usa backticks en sus raw SQL para compatibilidad "
    "con servidores MariaDB configurados con este modo.",
]))

story.append(Paragraph("Decisiones que debera tomar", styles["H2"]))
story.append(bullets([
    "<b>MariaDB local o gestionada</b>: use el MariaDB del propio cPanel o uno externo.",
    "<b>Subdominio para la API</b>: por convencion <i>api.midominio.com</i> apunta al backend.",
    "<b>URLs del frontend</b>: el frontend debe apuntar a la URL publica del backend.",
]))
story.append(PageBreak())

# 3. PREPARACION LOCAL
story.append(Paragraph("3. Preparacion local del proyecto", styles["H1"]))

story.append(Paragraph("Paso 3.1 - Instalar dependencias", styles["H2"]))
story.append(code_block("npm install"))

story.append(Paragraph("Paso 3.2 - Configurar variables de entorno", styles["H2"]))
story.append(Paragraph("Copie los archivos de ejemplo:", styles["Cuerpo"]))
story.append(code_block("cp apps/backend/.env.example apps/backend/.env\n"
                       "nano apps/backend/.env   # o su editor preferido"))
story.append(Paragraph("Variables disponibles (ver tambien Paso 5.5 en la seccion 5):", styles["Cuerpo"]))
story.append(bullets([
    "<b>DATABASE_URL</b>: <i>mysql://USER:PASS@HOST:3306/DB?charset=utf8mb4</i>.",
    "<b>JWT_SECRET</b>: minimo 32 caracteres aleatorios en produccion.",
    "<b>JWT_EXPIRES_IN</b>: por defecto <i>7d</i>.",
    "<b>PORT</b>: puerto interno del backend (cPanel suele asignarlo).",
    "<b>WEB_ORIGIN</b>: URL exacta del frontend (usada por CORS y redirects post-login).",
    "<b>BACKEND_ORIGIN</b>: URL publica del backend. Mismo valor que <i>WEB_ORIGIN</i> si estan en el mismo host. Necesario para OAuth (callback URL que passport pasa a Google/Apple).",
    "<b>ADMIN_EMAIL</b> y <b>ADMIN_INITIAL_PASSWORD</b>: credenciales del admin que crea el seed. <i>ADMIN_INITIAL_PASSWORD</i> debe ser <b>distinto de admin1234</b> en produccion o el backend rechaza arrancar.",
    "<b>GOOGLE_CLIENT_ID</b> / <b>GOOGLE_CLIENT_SECRET</b>: opcionales. Solo necesarios si se quiere login con Google.",
    "<b>APPLE_CLIENT_ID</b> / <b>APPLE_KEY_ID</b> / <b>APPLE_TEAM_ID</b> / <b>APPLE_PRIVATE_KEY</b>: opcionales. <i>APPLE_PRIVATE_KEY</i> recibe el PEM del <i>.p8</i> con saltos de linea escapados como <i>\\n</i> literal. Solo si se quiere login con Apple.",
    "<b>NODE_ENV</b>: <i>production</i> en el servidor.",
]))

story.append(Paragraph("Paso 3.3 - Compilar el backend", styles["H2"]))
story.append(code_block("npm run build -w apps/backend\n"
                       "# Salida: apps/backend/dist/"))

story.append(Paragraph("Paso 3.4 - Compilar el frontend Angular", styles["H2"]))
story.append(code_block("cd apps/frontend\n"
                       "npx ng build --configuration production\n"
                       "# Salida: apps/frontend/dist/frontend/browser/"))

story.append(Paragraph("Paso 3.5 - Pruebas locales finales", styles["H2"]))
story.append(code_block("# Levantar MariaDB local (Docker o brew services start mariadb)\n"
                       "cd apps/backend && npm start\n\n"
                       "# En otra terminal\n"
                       "cd apps/frontend && npx ng serve"))
story.append(callout(
    "No continue hasta haber verificado que todo funciona localmente con MariaDB.",
    kind="success"))
story.append(PageBreak())

# 4. BASE DE DATOS
story.append(Paragraph("4. Configuracion de la base de datos MariaDB", styles["H1"]))
story.append(callout(
    "El proyecto usa <b>MariaDB 10.5+</b> con Prisma (provider = 'mysql'). "
    "El charset <b>utf8mb4</b> es obligatorio en CREATE DATABASE y en la URL de conexion.",
    kind="danger"))

story.append(Paragraph("Paso 4.1 - Crear la base de datos en cPanel", styles["H2"]))
story.append(numbered([
    "Entre a cPanel y vaya a <b>MySQL Databases</b> (o 'Databases' -> 'MySQL').",
    "Cree una base de datos, por ejemplo <i>usuario_cualauto</i> (cPanel suele anteponer el usuario).",
    "Cree un usuario con contrasena robusta (ej. <i>usuario_app</i>).",
    "Asocie el usuario a la base con privilegios <b>ALL PRIVILEGES</b>.",
    "Anote: nombre de BD, usuario, contrasena y host (habitualmente <i>localhost</i>).",
]))
story.append(callout(
    "En cPanel compartido el host de MariaDB suele ser <i>localhost</i> (no la IP del servidor). "
    "Si el backend corre en otro host, use la IP o dominio del servidor MariaDB.",
    kind="info"))

story.append(Paragraph("Paso 4.2 - Asegurar charset utf8mb4", styles["H2"]))
story.append(Paragraph(
    "Verifique desde phpMyAdmin (cPanel -> phpMyAdmin) que la base creada use utf8mb4. "
    "Si fue creada con otro charset, ajuste con esta consulta SQL:", styles["Cuerpo"]))
story.append(code_block("-- Desde phpMyAdmin o cliente mariadb contra la BD de produccion\n"
                       "ALTER DATABASE usuario_cualauto\n"
                       "  CHARACTER SET utf8mb4\n"
                       "  COLLATE utf8mb4_unicode_ci;\n\n"
                       "-- Para cada tabla que Prisma cree:\n"
                       "ALTER TABLE Brand CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"))

story.append(Paragraph("Paso 4.3 - Construir la cadena DATABASE_URL", styles["H2"]))
story.append(code_block("# Formato general\n"
                       "DATABASE_URL=mysql://USUARIO:CONTRASENA@HOST:3306/NOMBRE_BD?charset=utf8mb4\n\n"
                       "# Ejemplo realista en cPanel compartido\n"
                       "DATABASE_URL=mysql://usuario_app:Cl4v3.Fu3rt3!@localhost:3306/usuario_cualauto?charset=utf8mb4\n\n"
                       "# Importante\n"
                       "# 1. charset=utf8mb4 SIEMPRE debe ir al final\n"
                       "# 2. Use 'localhost' y no la IP si todo corre en el mismo servidor\n"
                       "# 3. Escape los caracteres especiales en la contrasena (@ # ! etc.)"))

story.append(Paragraph("Paso 4.4 - Sobre el GRANT global para shadow DB", styles["H2"]))
story.append(Paragraph(
    "En desarrollo se usa <i>prisma migrate dev</i>, que requiere crear una <b>shadow database</b> "
    "para detectar drift. Esto obliga a dar permisos globales (*.*) al usuario MariaDB. "
    "<b>En produccion esto NO es necesario</b>: usamos <i>prisma migrate deploy</i>, que solo "
    "aplica migraciones y no crea shadow DB.",
    styles["Cuerpo"]))
story.append(callout(
    "Por seguridad, el usuario de produccion solo debe tener privilegios sobre la base del "
    "proyecto. El GRANT global solo se usa para el usuario de desarrollo/migrations.",
    kind="warn"))
story.append(PageBreak())

# 5. BACKEND EN CPANEL
story.append(Paragraph("5. Despliegue del backend Node.js en cPanel", styles["H1"]))

story.append(Paragraph(
    "Esta seccion describe el flujo estandar de deploy del backend en "
    "cPanel, <b>compilando directamente en el server</b>. A diferencia del "
    "flujo que sube <i>dist/</i> pre-compilado, este flujo requiere que las "
    "<i>devDependencies</i> (typescript, tsx, @types/*) esten presentes en "
    "<i>package.json</i>, porque el build se ejecuta en el server. La mayor "
    "parte del setup se hace desde el panel de cPanel (<b>Setup Node.js "
    "App</b>, gestionado por <b>Passenger</b>); los comandos de build y "
    "Prisma se corren dentro del <b>ambiente virtual</b> que cPanel crea "
    "para la app.",
    styles["Cuerpo"]))

# -----------------------------------------------------------------------------
# 5.1 Verificar dependencias de desarrollo
# -----------------------------------------------------------------------------
story.append(Paragraph("Paso 5.1 - Verificar dependencias de desarrollo en package.json",
                       styles["H2"]))
story.append(Paragraph(
    "Como el build se hace en el server, las <i>devDependencies</i> son "
    "obligatorias. Confirme que <i>apps/backend/package.json</i> las "
    "declara:", styles["Cuerpo"]))
story.append(code_block('"devDependencies": {\n'
                       '  "typescript": "~6.0.2",\n'
                       '  "tsx": "4.22.4",\n'
                       '  "@types/node": "20.19.43",\n'
                       '  "@types/express": "4.17.25",\n'
                       '  "@types/bcrypt": "5.0.2",\n'
                       '  "@types/cookie-parser": "1.4.10",\n'
                       '  "@types/jsonwebtoken": "9.0.10",\n'
                       '  "@types/multer": "2.2.0",\n'
                       '  "@types/supertest": "6.0.3",\n'
                       '  "supertest": "7.2.2",\n'
                       '  "vitest": "^4.0.8"\n'
                       '}'))
story.append(callout(
    "<b>Por que importan las devDependencies aqui:</b> este flujo NO usa "
    "<i>--omit=dev</i>. Se necesita <i>typescript</i> para <i>npm run "
    "build</i>, <i>tsx</i> para ejecutar el seed, y los <i>@types/*</i> "
    "para que TypeScript compile sin errores.",
    kind="warn"))

# -----------------------------------------------------------------------------
# 5.2 Subir solo lo esencial al server
# -----------------------------------------------------------------------------
story.append(Paragraph("Paso 5.2 - Subir solo lo esencial al server", styles["H2"]))
story.append(Paragraph(
    "El backend NO debe ir dentro de <i>public_html</i>. Cree una carpeta "
    "fuera del alcance del servidor web, normalmente en el home del "
    "usuario de cPanel, y suba unicamente lo que se compilara en el "
    "server:", styles["Cuerpo"]))
story.append(code_block("~/cualauto-backend/\n"
                       "  +- src/                  (codigo TypeScript, se compila en el server)\n"
                       "  +- package.json\n"
                       "  +- package-lock.json     (lockfile para npm install reproducible)\n"
                       "  +- tsconfig.json         (config TypeScript del backend)\n"
                       "  +- tsconfig.base.json    (base, extendida por tsconfig.json)\n"
                       "  +- prisma/\n"
                       "  |    +- schema.prisma\n"
                       "  |    +- migrations/      (incluye 20260703221041_init/)\n"
                       "  |    +- seed.ts\n"
                       "  +- .env                  (variables de entorno, por canal seguro)\n"
                       "  +- .env.example          (plantilla, sin secretos)"))
story.append(bullets([
    "<b>Que NO debe subirse</b>: <i>node_modules/</i> (se regenera en el "
    "server), <i>dist/</i> (se compila en el server), <i>vendor/</i> "
    "(se genera en el server con <i>prisma generate</i>), "
    "<i>apps/backend/public/</i>, <i>.angular/cache/</i>, archivos "
    "basura (.DS_Store, Thumbs.db).",
]))
story.append(Paragraph("Metodos de subida", styles["H3"]))
story.append(bullets([
    "<b>Git (recomendado si cPanel provee terminal SSH)</b>: clone el "
    "repositorio directamente. Asi el deploy se reduce a <i>git pull</i> "
    "y luego los pasos de build.",
    "<b>SFTP</b>: use FileZilla o Cyberduck para subir la carpeta. "
    "Excluya <i>node_modules/</i>, <i>dist/</i>, <i>vendor/</i>, "
    "<i>.env</i> (subir aparte por canal seguro).",
    "<b>Administrador de archivos de cPanel</b>: suba un <i>.zip</i> "
    "con solo lo esencial y descomprima en el server.",
]))
story.append(callout(
    "<b>.env esta en .gitignore</b> y debe subirse por separado (SFTP, "
    "SSH o el editor del panel). Nunca commitearlo.",
    kind="danger"))

# -----------------------------------------------------------------------------
# 5.3 Registrar la aplicacion en Passenger
# -----------------------------------------------------------------------------
story.append(Paragraph("Paso 5.3 - Registrar la aplicacion en Passenger (Setup Node.js App)",
                       styles["H2"]))
story.append(Paragraph(
    "Vaya a cPanel -> <b>Setup Node.js App</b> (o 'Software' -> "
    "'Node.js Selector') y registre la aplicacion:", styles["Cuerpo"]))
story.append(numbered([
    "Haga clic en <b>Create Application</b>.",
    "Configure los campos:",
]))
story.append(bullets([
    "Node.js version: <b>20.x</b> (es el valor del archivo <i>.nvmrc</i>).",
    "Application mode: <b>Production</b>.",
    "Application root: <i>cualauto-backend</i> (la ruta del Paso 5.2).",
    "Application URL: por ejemplo, <i>api.midominio.com</i>.",
    "Application startup file: <i>dist/src/index.js</i> (resultado de "
    "<i>npm run build</i>; lo crearemos en el Paso 5.5).",
    "Application port: anote el puerto asignado por cPanel.",
]))
story.append(callout(
    "<b>Por que <i>dist/src/index.js</i> y no <i>dist/index.js</i>?</b> "
    "El <i>tsconfig.json</i> del backend tiene <i>rootDir: '.'</i> e "
    "<i>include: ['src', '__tests__']</i>, por lo que TypeScript "
    "preserva la estructura al compilar: el entry point queda en "
    "<i>dist/src/index.js</i>.",
    kind="info"))
story.append(numbered([
    "Tras crear la aplicacion, pulse <b>'Run NPM Install'</b> (tambien "
    "aparece como <b>'Ensure dependencies'</b> en versiones recientes "
    "de cPanel). Esta accion delega en <b>Passenger</b> la instalacion "
    "de dependencias (incluyendo devDependencies), lo cual es util "
    "cuando la terminal SSH esta limitada o <i>npm install</i> directo "
    "falla por LVE/CloudLinux.",
    "Espere a que termine. Passenger creara <i>node_modules/</i> con "
    "tanto dependencies como devDependencies.",
]))
story.append(callout(
    "<b>Que hace 'Ensure dependencies':</b> Passenger ejecuta "
    "<i>npm install</i> en un proceso con su propio sandbox de memoria, "
    "evitando los limites LVE que pueden romper <i>prisma generate</i> "
    "cuando se corre desde la terminal compartida. Si aun asi falla, "
    "ejecute <i>npx prisma generate</i> manualmente en el Paso 5.5.",
    kind="info"))

# -----------------------------------------------------------------------------
# 5.4 Instalar Node y activar el ambiente virtual
# -----------------------------------------------------------------------------
story.append(Paragraph("Paso 5.4 - Instalar Node y activar el ambiente virtual",
                       styles["H2"]))
story.append(Paragraph(
    "Una vez registrada la aplicacion, cPanel crea un <b>entorno virtual "
    "de Node aislado</b> para esa app (con su propia version de node y "
    "npm, y un PATH independiente). El panel muestra el comando exacto "
    "en la seccion <b>'Enter to the virtual environment'</b> de la app "
    "registrada. Tipicamente luce asi:", styles["Cuerpo"]))
story.append(code_block("# Reemplace <usuario> por su usuario de cPanel\n"
                       "source /home/<usuario>/nodevenv/cualauto-backend/20/bin/activate\n\n"
                       "# Verificar que apunta al node del ambiente aislado:\n"
                       "which node\n"
                       "# /home/<usuario>/nodevenv/cualauto-backend/20/bin/node\n\n"
                       "node --version\n"
                       "# v20.x.x"))
story.append(callout(
    "<b>Por que activar el ambiente virtual?</b> Sin activarlo, los "
    "comandos <i>node</i> y <i>npm</i> que ejecute pueden ser los del "
    "sistema (otra version, sin las deps de la app), lo que rompe el "
    "build o la ejecucion de Prisma. Active el ambiente SIEMPRE antes "
    "de los comandos del Paso 5.5.",
    kind="warn"))
story.append(Paragraph(
    "Si la version de Node 20 no aparece disponible en cPanel, el "
    "hosting puede no tenerla. En ese caso contacte a su proveedor o "
    "considere las <b>Alternativas recomendadas</b> en la seccion 10.",
    styles["Cuerpo"]))

# -----------------------------------------------------------------------------
# 5.5 Compilar y aplicar esquema
# -----------------------------------------------------------------------------
story.append(Paragraph("Paso 5.5 - Compilar y aplicar esquema (build + Prisma + seed)",
                       styles["H2"]))
story.append(Paragraph(
    "Con el ambiente virtual activo y posicionado en la raiz del "
    "backend (<i>cd ~/cualauto-backend</i>), ejecute en orden:",
    styles["Cuerpo"]))
story.append(code_block("cd ~/cualauto-backend\n\n"
                       "# 1. Generar el cliente Prisma (necesario antes del build)\n"
                       "npx prisma generate\n\n"
                       "# 2. Compilar TypeScript -> dist/\n"
                       "npm run build\n\n"
                       "# 3. Aplicar migraciones pendientes (no crea nuevas)\n"
                       "npx prisma migrate deploy\n\n"
                       "# 4. Sembrar datos iniciales (marcas, modelos, admin)\n"
                       "npx tsx prisma/seed.ts"))
story.append(Paragraph("Que hace cada comando", styles["H3"]))
story.append(bullets([
    "<b>npx prisma generate</b>: genera el cliente Prisma en "
    "<i>node_modules/.prisma/client/</i>. Aunque Passenger ya corrio "
    "<i>npm install</i> (Paso 5.3), este paso es idempotente y asegura "
    "que el cliente este actualizado con <i>schema.prisma</i>.",
    "<b>npm run build</b>: ejecuta <i>tsc -p tsconfig.json</i> y produce "
    "<i>dist/src/index.js</i> (el entry point que Passenger arrancara).",
    "<b>npx prisma migrate deploy</b>: aplica las migraciones SQL "
    "pendientes (la inicial <i>20260703221041_init/</i> crea todas las "
    "tablas: Brand, Model, Version, EquipmentItem, VersionEquipment, "
    "MaintenanceCost, User, Comparison, ComparisonItem, Favorite).",
    "<b>npx tsx prisma/seed.ts</b>: pobla la BD con datos de ejemplo y "
    "crea el usuario admin (<i>ADMIN_EMAIL</i> + <i>ADMIN_INITIAL_PASSWORD</i> "
    "del <i>.env</i>).",
]))
story.append(callout(
    "<b>Orden importante:</b> <i>prisma generate</i> antes de "
    "<i>npm run build</i>, porque TypeScript importa tipos desde "
    "<i>@prisma/client</i>. El hook <i>prebuild</i> del "
    "<i>package.json</i> ya invoca <i>prisma generate</i> "
    "automaticamente, pero ejecutarlo explicito es mas claro para "
    "diagnosticar.",
    kind="info"))
story.append(callout(
    "Si <i>npx prisma generate</i> falla con "
    "<i>'WebAssembly.Instance(): Out of memory'</i> (limite LVE de "
    "CloudLinux), pre-genere el cliente en una maquina local con RAM "
    "suficiente (<i>npm run db:generate -w apps/backend && npm run "
    "vendor:prisma -w apps/backend</i>) y suba la carpeta "
    "<i>vendor/prisma-client/</i> junto al resto del codigo. Passenger "
    "la recogera automaticamente al reiniciar.",
    kind="warn"))

# -----------------------------------------------------------------------------
# 5.6 Reiniciar la aplicacion
# -----------------------------------------------------------------------------
story.append(Paragraph("Paso 5.6 - Reiniciar la aplicacion Node", styles["H2"]))
story.append(Paragraph(
    "En cPanel -> <b>Setup Node.js App</b>, pulse <b>Restart</b> sobre "
    "la app <i>cualauto-backend</i>. Passenger detendra el proceso "
    "actual y arrancara <i>node dist/src/index.js</i> dentro del "
    "ambiente virtual.", styles["Cuerpo"]))
story.append(bullets([
    "Verifique los logs desde el panel o en "
    "<i>~/cualauto-backend/.cpanel_node.yml</i>.",
    "Si el restart queda en bucle, revise <i>DATABASE_URL</i>, "
    "<i>JWT_SECRET</i> y que <i>ADMIN_INITIAL_PASSWORD</i> no sea "
    "<i>admin1234</i>.",
]))
story.append(callout(
    "Tras editar <i>.env</i> siempre hay que reiniciar para que "
    "Passenger recargue las variables. El reload automatico solo "
    "aplica a cambios de codigo, no de entorno.",
    kind="info"))

# -----------------------------------------------------------------------------
# 5.7 Verificar el backend
# -----------------------------------------------------------------------------
story.append(Paragraph("Paso 5.7 - Verificar el backend", styles["H2"]))
story.append(code_block("# Health check (el endpoint /health existe en este proyecto)\n"
                       "curl https://api.midominio.com/health\n"
                       "# Respuesta esperada:\n"
                       '# {"data":{"status":"ok","env":"https://midominio.com"}}'))
story.append(callout(
    "El endpoint <i>/health</i> confirma que el backend arranco, que "
    "la variable <i>WEB_ORIGIN</i> se cargo correctamente y que la "
    "conexion a MariaDB funciona. Si responde OK, el deploy basico "
    "esta completo. Para troubleshooting, ver seccion 9.",
    kind="success"))
story.append(callout(
    "Si prefiere verificar dentro del ambiente virtual antes de "
    "exponer el backend, ejecute: "
    "<i>curl http://localhost:PUERTO_ASIGNADO/health</i> tras hacer "
    "Restart. Passenger expone la app en localhost antes del proxy "
    "reverso.",
    kind="info"))
story.append(PageBreak())

# 6. FRONTEND
story.append(Paragraph("6. Despliegue del frontend Angular", styles["H1"]))

story.append(Paragraph("Paso 6.1 - Configurar la URL del backend en environments", styles["H2"]))
story.append(Paragraph(
    "El frontend usa la convencion estandar de Angular con dos archivos de "
    "environment y <i>fileReplacements</i> en <i>angular.json</i>. En build de "
    "desarrollo se usa <i>environment.ts</i> (apunta a <i>localhost:3000</i>); en "
    "build de produccion se reemplaza por <i>environment.prod.ts</i> con la URL "
    "del backend desplegado.",
    styles["Cuerpo"]))

story.append(Paragraph("Estructura de archivos", styles["H3"]))
story.append(code_block("apps/frontend/\n"
                       "  +- src/\n"
                       "  |    +- environments/\n"
                       "  |    |    +- environment.ts          (dev: localhost:3000)\n"
                       "  |    |    +- environment.prod.ts     (prod: URL real)\n"
                       "  |    +- app/\n"
                       "  |    |    +- core/\n"
                       "  |    |    |    +- env.ts              (punto de acceso, importa de environments/environment)\n"
                       "  +- angular.json                         (define fileReplacements)"))

story.append(Paragraph("Paso 6.1.1 - Verificar/crear environment.ts (dev)", styles["H3"]))
story.append(code_block("// apps/frontend/src/environments/environment.ts\nexport const environment = {\n"
                       "  production: false,\n"
                       "  apiBase: 'http://localhost:3000/api/v1',\n"
                       "} as const;"))
story.append(callout(
    "Este archivo ya existe en el proyecto. Si necesitas crearlo, hazlo en "
    "<i>apps/frontend/src/environments/environment.ts</i>. La clave exportada "
    "debe llamarse <b>environment</b> (Angular CLI busca este nombre por "
    "convencion) y debe incluir <i>apiBase</i> con la URL completa del backend "
    "(incluyendo el path <i>/api/v1</i>).",
    kind="info"))

story.append(Paragraph("Paso 6.1.2 - Configurar environment.prod.ts (produccion)", styles["H3"]))
story.append(code_block("// apps/frontend/src/environments/environment.prod.ts\nexport const environment = {\n"
                       "  production: true,\n"
                       "  apiBase: 'https://api.midominio.com/api/v1',\n"
                       "} as const;"))
story.append(callout(
    "<b>IMPORTANTE: la URL DEBE terminar en <i>/api/v1</i></b>. El backend monta "
    "todas las rutas bajo ese prefijo (ver <i>apps/backend/src/app.ts</i>: "
    "<i>app.use('/api/v1/...')</i>). Si omites <i>/api/v1</i>, el frontend "
    "llamara a <i>https://api.midominio.com/models</i> y el backend respondera "
    "404 porque la ruta real es <i>https://api.midominio.com/api/v1/models</i>.",
    kind="danger"))
story.append(callout(
    "Reemplaza <i>api.midominio.com</i> por el dominio real del backend "
    "(el mismo que configuraste en <i>Application URL</i> del Setup Node.js App "
    "de cPanel). Esta URL debe coincidir con <i>WEB_ORIGIN</i> en el "
    "<i>.env</i> del backend, porque el backend la usa en la validacion CORS.",
    kind="warn"))

story.append(Paragraph("Paso 6.1.3 - Verificar fileReplacements en angular.json", styles["H3"]))
story.append(Paragraph(
    "El bloque <i>configurations.production</i> de <i>apps/frontend/angular.json</i> "
    "debe incluir un <i>fileReplacements</i> que apunte a <i>environment.prod.ts</i>:",
    styles["Cuerpo"]))
story.append(code_block("// apps/frontend/angular.json (fragmento)\n"
                       "\"configurations\": {\n"
                       "  \"production\": {\n"
                       "    \"budgets\": [ ... ],\n"
                       "    \"outputHashing\": \"all\",\n"
                       "    \"fileReplacements\": [\n"
                       "      {\n"
                       "        \"replace\": \"src/environments/environment.ts\",\n"
                       "        \"with\": \"src/environments/environment.prod.ts\"\n"
                       "      }\n"
                       "    ]\n"
                       "  },\n"
                       "  \"development\": { ... }\n"
                       "}"))
story.append(callout(
    "Esta configuracion hace que al ejecutar <i>ng build --configuration "
    "production</i>, Angular CLI reemplace automaticamente <i>environment.ts</i> "
    "por <i>environment.prod.ts</i> en el bundle final. <b>No es necesario "
    "editar el codigo fuente</b> en cada build; solo cambia el contenido de "
    "<i>environment.prod.ts</i> antes de cada deploy.",
    kind="success"))

story.append(Paragraph("Paso 6.1.4 - Verificar env.ts (punto de acceso)", styles["H3"]))
story.append(Paragraph(
    "El archivo <i>apps/frontend/src/app/core/env.ts</i> es el unico punto que "
    "lee <i>environment</i>. Lo importa y expone la constante <i>ENV</i> que usa "
    "el resto del codigo (<i>ApiService</i>, etc.).",
    styles["Cuerpo"]))
story.append(code_block("// apps/frontend/src/app/core/env.ts\n"
                       "import { environment } from '../../environments/environment';\n\n"
                       "export const ENV = {\n"
                       "  apiBase:\n"
                       "    (typeof window !== 'undefined' &&\n"
                       "      (window as { __env?: { apiBase?: string } }).__env?.apiBase) ||\n"
                       "    environment.apiBase,\n"
                       "  production: environment.production,\n"
                       "} as const;"))
story.append(callout(
    "El fallback a <i>window.__env</i> se mantiene por compatibilidad con "
    "despliegues que prefieran inyectar la URL en runtime via un <i>&lt;script&gt;</i> "
    "en <i>index.html</i>. En produccion normal, <i>environment.prod.ts</i> es el "
    "que se usa (gracias al fileReplacement) y <i>window.__env</i> no existe.",
    kind="info"))

story.append(Paragraph("Paso 6.1.5 - Compilar frontend para produccion", styles["H3"]))
story.append(code_block("cd apps/frontend\n\n"
                       "# Build + verificacion automatica del bundle:\n"
                       "npm run build:prod\n"
                       "# Equivale a: ng build --configuration production && node scripts/verify-frontend-bundle.cjs\n\n"
                       "# Salida esperada:\n"
                       "#   [verify] apiBase en el bundle: https://api.midominio.com/api/v1\n"
                       "#   [verify] OK:   apiBase no apunta a localhost\n"
                       "#   [verify] OK:   apiBase usa https\n"
                       "#   [verify]       Prefijo detectado del backend: /api/v1\n"
                       "#   [verify] OK:   apiBase termina en /api/v1 (correcto, coincide con el backend)\n"
                       "#   [verify] TODAS LAS VERIFICACIONES PASARON\n\n"
                       "# Si la verificacion FALLA, el build NO es valido para produccion.\n"
                       "# Corrige environment.prod.ts y vuelve a correr build:prod."))
story.append(callout(
    "<b>El script <i>verify-frontend-bundle.cjs</i></b> lee el codigo fuente del "
    "backend (<i>apps/backend/src/app.ts</i>) y detecta automaticamente el prefijo "
    "que usa el backend (ej: <i>/api/v1</i>). Luego valida que el <i>apiBase</i> "
    "del frontend termine exactamente en ese prefijo. Esto elimina la posibilidad "
    "de olvidar el sufijo (causa mas comun de 404 en produccion) aunque el "
    "prefijo del backend cambie en el futuro.",
    kind="success"))
story.append(callout(
    "<b>Que verifica concretamente</b>:\n"
    "  1. Que el bundle existe en <i>dist/frontend/browser/</i>\n"
    "  2. Que <i>apiBase</i> no apunta a localhost (no es un build de dev)\n"
    "  3. Que <i>apiBase</i> usa https\n"
    "  4. <b>Que <i>apiBase</i> termina en el prefijo detectado del backend</b>\n"
    "  5. Que hay exactamente un valor de <i>apiBase</i> en el bundle\n"
    "Si alguna falla, el script sale con codigo 1 y el deploy no debe continuar.\n"
    "Puedes correrlo solo con: <i>npm run verify:bundle</i>",
    kind="info"))

story.append(Paragraph("Paso 6.2 - Subir los archivos estaticos a public_html", styles["H2"]))
story.append(numbered([
    "Localice la carpeta <i>apps/frontend/dist/frontend/browser/</i>.",
    "En cPanel abra el Administrador de archivos y vaya a <i>public_html</i>.",
    "Suba el contenido de <i>browser/</i> dentro de <i>public_html</i>.",
    "Verifique que <i>index.html</i> quede en la raiz.",
]))

story.append(Paragraph("Paso 6.3 - Configurar reescritura de URL (.htaccess)", styles["H2"]))
story.append(code_block("# public_html/.htaccess\n"
                       "<IfModule mod_rewrite.c>\n"
                       "  RewriteEngine On\n"
                       "  RewriteBase /\n"
                       "  RewriteRule ^index\\.html$ - [L]\n"
                       "  RewriteCond %{REQUEST_FILENAME} !-f\n"
                       "  RewriteCond %{REQUEST_FILENAME} !-d\n"
                       "  RewriteRule . /index.html [L]\n"
                       "</IfModule>\n\n"
                       "<IfModule mod_deflate.c>\n"
                       "  AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json\n"
                       "</IfModule>\n\n"
                       "<IfModule mod_expires.c>\n"
                       "  ExpiresActive On\n"
                       "  ExpiresByType text/css \"access plus 1 month\"\n"
                       "  ExpiresByType application/javascript \"access plus 1 month\"\n"
                       "  ExpiresByType image/png \"access plus 6 months\"\n"
                       "</IfModule>"))

story.append(Paragraph("Paso 6.4 - Configurar WEB_ORIGIN en el backend (CORS)", styles["H2"]))
story.append(Paragraph(
    "El backend valida CORS comparando el header <i>Origin</i> con <b>WEB_ORIGIN</b>. "
    "El match debe ser <b>exacto</b> (esquema + host + puerto si no es 443):",
    styles["Cuerpo"]))
story.append(code_block("# apps/backend/.env\n"
                       "WEB_ORIGIN=https://midominio.com\n\n"
                       "# Si sirve el frontend en www.midominio.com y no en midominio.com,\n"
                       "# ajuste WEB_ORIGIN a esa URL exacta. No admite multiples origenes."))
story.append(callout(
    "Si el navegador reporta 'CORS policy: No Access-Control-Allow-Origin', revise que "
    "el valor de WEB_ORIGIN coincida exactamente con el origen que envia el navegador.",
    kind="warn"))

story.append(Paragraph("Paso 6.5 - Verificar el frontend", styles["H2"]))
story.append(numbered([
    "Abra <i>https://midominio.com</i> en el navegador.",
    "Verifique que la pagina principal carga sin errores (F12 -> Console).",
    "Navegue a una ruta interna (ej. <i>/catalogo</i>) y verifique que NO aparece 404.",
    "Realice una peticion al backend: deberia obtener respuesta JSON sin error CORS.",
]))
story.append(PageBreak())

# 7. SSL Y DOMINIO
story.append(Paragraph("7. Configuracion de SSL y dominio", styles["H1"]))

story.append(Paragraph("Paso 7.1 - SSL con Let's Encrypt", styles["H2"]))
story.append(numbered([
    "En cPanel vaya a <b>SSL/TLS Status</b> o <b>Let's Encrypt</b>.",
    "Seleccione el dominio principal y los subdominios (ej. <i>api.midominio.com</i>).",
    "Haga clic en <b>Issue</b> y espere unos segundos.",
    "Active <b>Force HTTPS Redirect</b>.",
]))

story.append(Paragraph("Paso 7.2 - DNS si su dominio esta en otro proveedor", styles["H2"]))
story.append(bullets([
    "Cambie los nameservers al hosting, o cree registros A apuntando a la IP del servidor.",
    "Subdominio <i>api.midominio.com</i>: registro A -> IP del hosting.",
    "Verifique con <i>nslookup midominio.com</i> o <i>dig midominio.com</i>.",
]))

story.append(Paragraph("Paso 7.3 - Cabeceras de seguridad", styles["H2"]))
story.append(code_block("# Anada al .htaccess del frontend\n"
                       "<IfModule mod_headers.c>\n"
                       "  Header set Strict-Transport-Security \"max-age=31536000; includeSubDomains\" env=HTTPS\n"
                       "  Header set X-Content-Type-Options \"nosniff\"\n"
                       "  Header set X-Frame-Options \"SAMEORIGIN\"\n"
                       "  Header set Referrer-Policy \"strict-origin-when-cross-origin\"\n"
                       "</IfModule>"))
story.append(PageBreak())

# 8. VERIFICACION
story.append(Paragraph("8. Verificacion final y monitoreo", styles["H1"]))

story.append(Paragraph("Checklist de verificacion", styles["H2"]))
checks = [
    ["Item", "Verificacion"],
    ["MariaDB", "BD creada con charset utf8mb4; collation utf8mb4_unicode_ci"],
    ["DATABASE_URL", "Termina en ?charset=utf8mb4"],
    ["Backend /health", "GET https://api.midominio.com/health responde JSON ok"],
    ["Frontend", "Carga la pagina principal sin errores en consola"],
    ["Rutas SPA", "Las rutas internas (/catalogo, etc.) cargan sin 404"],
    ["CORS", "Peticion desde el frontend NO falla por CORS"],
    ["Login/Auth", "Flujo completo de autenticacion funciona"],
    ["Prisma", "Consultas a la BD funcionan sin errores de driver"],
    ["Seed admin", "Usuario admin creado y puede iniciar sesion"],
    ["SSL", "Certificado valido; HTTP redirige a HTTPS"],
    ["Logs", "Sin errores criticos en logs del backend"],
]
tbl = Table(checks, colWidths=[4.5*cm, 12*cm])
tbl.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), PRIMARY),
    ("TEXTCOLOR", (0,0), (-1,0), white),
    ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
    ("FONTSIZE", (0,0), (-1,0), 10),
    ("FONTNAME", (0,1), (-1,-1), "Helvetica"),
    ("FONTSIZE", (0,1), (-1,-1), 10),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [white, LIGHT_BG]),
    ("BOX", (0,0), (-1,-1), 0.4, HexColor("#475569")),
    ("GRID", (0,0), (-1,-1), 0.3, HexColor("#cbd5e1")),
    ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ("LEFTPADDING", (0,0), (-1,-1), 6),
    ("RIGHTPADDING", (0,0), (-1,-1), 6),
    ("TOPPADDING", (0,0), (-1,-1), 4),
    ("BOTTOMPADDING", (0,0), (-1,-1), 4),
]))
story.append(tbl)
story.append(Spacer(1, 0.4*cm))

story.append(Paragraph("Monitoreo basico", styles["H2"]))
story.append(bullets([
    "Active monitoreo de uptime externo (UptimeRobot, Better Uptime, etc.).",
    "Revise periodicamente los logs en <i>~/cualauto-backend/*.log</i> y la seccion 'Errors' de cPanel.",
    "Configure backups automaticos de MariaDB desde cPanel -> Backup.",
    "Documente cualquier cambio en el servidor en un runbook para el equipo.",
]))
story.append(PageBreak())

# 9. PROBLEMAS FRECUENTES
story.append(Paragraph("9. Problemas frecuentes", styles["H1"]))

problemas = [
    ("Error 'Unknown character set: utf8mb4'",
     "Su servidor MariaDB es muy antiguo. MariaDB 10.5+ soporta utf8mb4 nativamente. "
     "Considere actualizar o usar utf8 (sin mb4) aunque perdera soporte de emojis."),
    ("Prisma: 'P1001: Can't reach database server'",
     "Verifique DATABASE_URL, que el servicio MariaDB este activo y que el usuario "
     "pueda conectarse desde el host del backend."),
    ("Prisma: 'P2002: Unique constraint failed' al ejecutar el seed",
     "El seed re-crea versiones y joins con create directo. Si ya hay datos, primero "
     "limpie las tablas: <i>DELETE FROM VersionEquipment; DELETE FROM MaintenanceCost; "
     "DELETE FROM Version; DELETE FROM Model;</i>"),
    ("Prisma migrate deploy falla con 'Migration not found'",
     "Asegurese de haber subido la carpeta <i>prisma/migrations/20260703221041_init/</i> "
     "con su archivo migration.sql."),
    ("npx tsx prisma/seed.ts falla con 'Cannot find module src/config/env.js'",
     "El seed es auto-contenido y carga el .env directamente con dotenv (no "
     "importa src/config/env). Si tu seed es de una version anterior a este fix, "
     "reemplaza 'import { env } from \"../src/config/env.js\"' por dotenv + zod "
     "inline. Ver Paso 5.5 para los detalles."),
    ("El backend no arranca: 'ADMIN_INITIAL_PASSWORD must be overridden'",
     "Cambio la variable en .env. El default 'admin1234' esta bloqueado en produccion "
     "por una salvaguarda explicita del proyecto."),
    ("Todas las llamadas del frontend al backend dan 404 (ej: GET /models 404)",
     "El apiBase del frontend no incluye el sufijo '/api/v1'. El backend monta "
     "todas las rutas bajo /api/v1, asi que el frontend debe llamar a "
     "https://api.midominio.com/api/v1/models, no a https://api.midominio.com/models. "
     "Edita src/environments/environment.prod.ts y agrega '/api/v1' al final de "
     "apiBase. Luego regenera el bundle (npm run build:prod incluye una "
     "verificacion automatica que detecta este error)."),
    ("El bundle del frontend apunta a localhost despues de hacer build:prod",
     "El fileReplacement en angular.json no esta aplicando. Verifica que "
     "configurations.production tenga 'fileReplacements' apuntando a "
     "src/environments/environment.prod.ts. Si no esta, agregalo (ver paso 6.1.3)."),
    ("El backend no arranca: 'JWT_SECRET too short'",
     "JWT_SECRET debe tener al menos 16 caracteres. Genere uno con: "
     "<i>node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\"</i>."),
    ("CORS: 'No Access-Control-Allow-Origin header'",
     "WEB_ORIGIN debe coincidir EXACTAMENTE con el origen que envia el navegador "
     "(esquema + host + puerto si no es 443)."),
    ("Frontend muestra 404 al refrescar rutas internas",
     "Falta el .htaccess del paso 6.3 con la reescritura a index.html."),
    ("Build de Angular muy pesado / se queda sin memoria",
     "Habilite code splitting con loadChildren o use @defer. En cPanel compartido "
     "puede ser necesario un VPS para el build inicial."),
    ("Caracteres raros (Ã±, Ã©, etc.) en datos",
     "La BD o las tablas no estan en utf8mb4. Aplique ALTER DATABASE / ALTER TABLE del paso 4.2."),
    ("La aplicacion se cae sola despues de un tiempo",
     "Planes compartidos reciclan procesos. Considere migrar a VPS o plataforma gestionada."),
    ("prisma generate falla con 'WebAssembly.Instance(): Out of memory' (limite LVE de CloudLinux)",
     "En el nuevo flujo de deploy, <i>prisma generate</i> se corre en el server en el Paso 5.5. "
     "Si el LVE de CloudLinux rechaza el WebAssembly de Prisma, la primera linea de defensa es "
     "<b>'Ensure dependencies'</b> del Paso 5.3 (Passenger corre <i>npm install</i> en un sandbox "
     "con mas memoria). Si aun asi falla, pre-genere el cliente en una maquina local con RAM "
     "suficiente (<i>npm run db:generate -w apps/backend && npm run vendor:prisma -w apps/backend</i>), "
     "suba la carpeta <i>vendor/prisma-client/</i> junto al resto del codigo y luego ejecute "
     "<i>npx prisma generate</i> en el Paso 5.5 (Passenger la recogera al reiniciar)."),
     ("El backend arranca pero Prisma no conecta: 'P1001 Can't reach database server'",
      "Verifique que <i>DATABASE_URL</i> en <i>.env</i> apunta al host:puerto correcto, que el "
      "usuario MySQL existe, que la base de datos esta creada y que el charset es utf8mb4. "
      "Tambien confirme que el servidor de BD escucha en la IP que <i>DATABASE_URL</i> indica "
      "(en MariaDB local suele ser <i>localhost</i> o <i>127.0.0.1</i>; si el backend esta en "
      "otro container/host, use la IP correspondiente)."),
     ("Los botones OAuth no aparecen despues del deploy",
      "El endpoint <i>GET /auth/providers</i> debe devolver <i>{\"data\":{\"google\":true,\"apple\":false},\"error\":null}</i>. Si devuelve <i>google:false</i>, las envs <i>GOOGLE_CLIENT_ID</i>/<i>SECRET</i> no se cargaron: verifique que las puso en Setup Node.js App -> Environment (no en <i>.env</i> manualmente) y que reinicio la app. Si devuelve 404, falta la migracion <i>20260709120000_oauth_identity</i>; corra <i>npx prisma migrate deploy</i> en el server. Si devuelve 500, hay un error en el codigo OAuth - revisar logs."),
     ("Google muestra 'redirect_uri_mismatch' despues del deploy",
      "La URL registrada en Google Cloud Console no coincide con lo que passport envia. El backend envia <i>BACKEND_ORIGIN/api/v1/auth/google/callback</i>. Verifique que la entrada registrada en Google sea exactamente <i>https://cualautocompro.cl/api/v1/auth/google/callback</i> (sin <i>www</i>, sin <i>:443</i>, sin trailing slash, con el path completo). Solo una entrada por environment."),
     ("Tras login OAuth el navegador queda en blanco o no aparece logueado",
      "Tres causas probables: (1) el callback devuelve 404 (cPanel proxy bloquea el path /api/v1/auth/google/callback - revisar .htaccess o AllowOverride), (2) <i>WEB_ORIGIN</i> en el backend no coincide con el origen real del frontend (verificar <i>https://</i>, sin <i>www</i>), (3) <i>Secure: true</i> en la cookie pero el site se sirve por HTTP. Si todo parece correcto, abrir DevTools -> Network, hacer click en el boton, y revisar que la respuesta Set-Cookie tenga <i>Secure</i> y el dominio correcto."),
     ("El flujo OAuth funciona en local pero falla en cPanel",
      "Lo mas probable es diferencia entre <i>WEB_ORIGIN</i>/<i>BACKEND_ORIGIN</i> en <i>.env</i> del server vs el dev. En cPanel ambos suelen ser <i>https://cualautocompro.cl</i>. Si el backend esta en un subdominio (ej <i>api.cualautocompro.cl</i>), <i>BACKEND_ORIGIN</i> debe apuntar ahi. Google y Apple rechazan requests donde el redirect_uri de la config del provider no coincida exactamente con el <i>BACKEND_ORIGIN</i> + path. Verificar que los redirect URIs en Google Cloud Console y Apple Developer coincidan."),
     ("Errores 'invalid_client' o 'JWT signature' con Apple",
      "El <i>APPLE_PRIVATE_KEY</i> esta mal formada. La causa #1: el <i>.p8</i> original se pego con saltos de linea reales; deben ser <i>\\n</i> literales. La causa #2: el header <i>-----BEGIN PRIVATE KEY-----</i> o footer fueron truncados al pegar. La causa #3: el Team ID o Key ID estan al reves o mal copiados (son 10 caracteres exactos). Regenerar el string con el comando de la seccion 11.4.4."),
 ]
for titulo, solucion in problemas:
    story.append(Paragraph(f"<b>{titulo}</b>", styles["H3"]))
    story.append(Paragraph(solucion, styles["Cuerpo"]))
story.append(PageBreak())

# 10. ALTERNATIVAS
story.append(Paragraph("10. Alternativas recomendadas", styles["H1"]))
story.append(Paragraph(
    "Si su plan cPanel no soporta Node.js persistente o MariaDB en la version requerida, "
    "considere migrar a una plataforma mas adecuada para el stack. Las opciones mas usadas:",
    styles["Cuerpo"]))

alt_data = [
    ["Plataforma", "Frontend", "Backend", "MariaDB", "Costo aprox."],
    ["Render",     "Static Site", "Web Service Node", "Postgres (no MariaDB)", "Plan free + ~$7/mes"],
    ["Railway",    "Static Site", "Web Service Node", "MySQL/MariaDB disponible", "~$5/mes + uso"],
    ["Vercel + Railway", "Vercel (Angular)", "Railway (Node)", "Railway MariaDB", "Free + ~$5/mes"],
    ["DigitalOcean App Platform", "Static", "Node", "MySQL gestionado", "~$12/mes"],
    ["VPS (Hetzner, Contabo, DO)", "Manual", "Manual", "MariaDB manual", "$4-$20/mes"],
    ["Hostinger Cloud", "Si soporta Node", "Si soporta Node", "MariaDB", "$3-$10/mes"],
]
tbl = Table(alt_data, colWidths=[3.2*cm, 2.5*cm, 2.6*cm, 3.2*cm, 4.5*cm])
tbl.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), PRIMARY),
    ("TEXTCOLOR", (0,0), (-1,0), white),
    ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
    ("FONTSIZE", (0,0), (-1,-1), 9),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [white, LIGHT_BG]),
    ("BOX", (0,0), (-1,-1), 0.4, HexColor("#475569")),
    ("GRID", (0,0), (-1,-1), 0.3, HexColor("#cbd5e1")),
    ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ("LEFTPADDING", (0,0), (-1,-1), 4),
    ("RIGHTPADDING", (0,0), (-1,-1), 4),
    ("TOPPADDING", (0,0), (-1,-1), 4),
    ("BOTTOMPADDING", (0,0), (-1,-1), 4),
]))
story.append(tbl)
story.append(Spacer(1, 0.4*cm))

story.append(Paragraph("Recomendacion", styles["H2"]))
story.append(callout(
    "Para el stack cualautocompro (Angular + Node + Prisma + MariaDB) la opcion mas "
    "simple y confiable es <b>Vercel</b> (frontend Angular) + <b>Railway</b> (backend y BD MariaDB), "
    "con despliegues automaticos desde Git. Si requiere mantener cPanel por motivos del "
    "cliente, asegurese de que el plan soporte Node.js persistente y MariaDB 10.5+.",
    kind="success"))

# =============================================================================
# 11. LOGIN SOCIAL CON GOOGLE Y APPLE (OAuth 2.0 / OIDC)
# =============================================================================
story.append(PageBreak())
story.append(Paragraph(
    "11. Login social con Google y Apple (OAuth 2.0 / OIDC)",
    styles["H1"]))
story.append(Paragraph(
    "El sistema soporta inicio de sesion con cuentas de Google y Apple ademas "
    "del tradicional email + contrasena. Esta seccion documenta los pasos "
    "para activar ambos proveedores en produccion. Si solo quiere uno de los "
    "dos (por ejemplo Google ahora y Apple despues), es perfectamente "
    "valido: configure solo las variables y el panel del provider "
    "correspondiente; el otro boton simplemente no aparecera.",
    styles["Cuerpo"]))

story.append(Paragraph("Que se necesita configurar", styles["H2"]))
story.append(bullets([
    "<b>Backend:</b> 6 variables de entorno nuevas (Google: 2, Apple: 4).",
    "<b>Panel del provider:</b> redirect URI autorizado en Google Cloud Console "
    "o Apple Developer.",
    "<b>Base de datos:</b> nueva migracion Prisma <i>oauth_identity</i> que crea la tabla <i>UserIdentity</i> y hace <i>User.passwordHash</i> opcional.",
    "<b>Frontend:</b> sin cambios (ya viene integrado en el build).",
]))

# -----------------------------------------------------------------------------
# 11.1 Arquitectura del flujo
# -----------------------------------------------------------------------------
story.append(Paragraph("11.1 Arquitectura del flujo OAuth", styles["H2"]))
story.append(Paragraph(
    "El flujo sigue el patron estandar OAuth 2.0 Authorization Code con PKCE, "
    "implementado con <b>Passport.js</b> en el backend. No requiere "
    "ningun servicio externo de pago (Auth0, Clerk, Supabase) - todo el "
    "control queda en el codigo del proyecto.",
    styles["Cuerpo"]))
story.append(code_block(
    "[Usuario] -> [Frontend /login]\n"
    "   |  click 'Continuar con Google'\n"
    "   v\n"
    "[Backend GET /auth/google]\n"
    "   |  genera state firmado (HS256, 10min TTL) + nonce OIDC\n"
    "   |  cookie httpOnly 'oauth_state' en /api/v1/auth\n"
    "   v\n"
    "[Google accounts.google.com]\n"
    "   |  usuario autoriza con su Gmail\n"
    "   v\n"
    "[Backend GET /auth/google/callback?code=&state=]\n"
    "   |  verifica state vs cookie (CSRF protection)\n"
    "   |  intercambia code por tokens via POST a oauth2.googleapis.com/token\n"
    "   |  valida id_token (JWKS, issuer, aud, exp, email_verified)\n"
    "   |  llama OAuthService.resolveUser():\n"
    "   |    1. match por (provider, sub) en UserIdentity -> reutiliza User\n"
    "   |    2. match por email en User -> vincula UserIdentity\n"
    "   |    3. crea User + UserIdentity nuevo\n"
    "   |  setea cookie 'auth' (JWT firmado, 7d, secure: true)\n"
    "   v\n"
    "[Redirect 302 a WEB_ORIGIN + returnTo?oauth=ok]\n"
    "   |  ej: https://cualautocompro.cl/?oauth=ok\n"
    "   v\n"
    "[Frontend /]\n"
    "   |  AuthService.bootstrap() llama /auth/me con la cookie\n"
    "   |  currentUser signal queda poblado, header muestra el email del usuario\n"
    "   v\n"
    "[Logueado. Sin contrasena. Sin base de datos de terceros.]"))

story.append(callout(
    "<b>Sobre WEB_ORIGIN vs BACKEND_ORIGIN:</b> ahora hay dos env vars que "
    "suelen valer lo mismo en produccion pero tienen propositos diferentes:",
    kind="info"))
story.append(bullets([
    "<b>WEB_ORIGIN</b>: URL publica del FRONTEND. Usada por CORS y para redirigir al usuario despues del login.",
    "<b>BACKEND_ORIGIN</b>: URL publica del BACKEND. Usada por passport como <i>redirect_uri</i> que pasa a Google/Apple. Si backend y frontend son el mismo host (caso cPanel), vale lo mismo que <i>WEB_ORIGIN</i>.",
    "En cPanel con virtual host compartido, ambos son <i>https://cualautocompro.cl</i>.",
]))

# -----------------------------------------------------------------------------
# 11.2 Migracion Prisma
# -----------------------------------------------------------------------------
story.append(Paragraph("11.2 Aplicar la migracion Prisma oauth_identity", styles["H2"]))
story.append(Paragraph(
    "Antes del primer deploy con OAuth, aplique la migracion en la BD de "
    "produccion. Sin esto, GET /auth/providers devuelve 500 porque la tabla "
    "<i>UserIdentity</i> no existe.",
    styles["Cuerpo"]))
story.append(Paragraph(
    "Si deploya en el server con el flujo del Capitulo 5.5, el comando se "
    "corre automaticamente:",
    styles["Cuerpo"]))
story.append(code_block(
    "cd cualauto-backend   # o donde este el backend en el server\n"
    "source /home/USUARIO/nodevenv/cualauto-backend/20/bin/activate\n"
    "npx prisma migrate deploy\n"
    "\n"
    "# Esperado:\n"
    "# 1 migration found in prisma/migrations\n"
    "# Applying migration `20260709120000_oauth_identity`\n"
    "# All migrations have been successfully applied."))
story.append(callout(
    "<b>Idempotente</b>: si ya se aplico, no hace nada. <b>NO usar "
    "<i>prisma migrate dev</i></b> en produccion (pide shadow DB y hace "
    "cambios no revisados).",
    kind="warn"))

# -----------------------------------------------------------------------------
# 11.3 Google Cloud Console
# -----------------------------------------------------------------------------
story.append(Paragraph("11.3 Configurar Google Cloud Console", styles["H2"]))
story.append(Paragraph(
    "Google requiere registrar el redirect URI exacto que el backend "
    "pasara al provider. El backend usa <i>BACKEND_ORIGIN/api/v1/auth/google/callback</i>.",
    styles["Cuerpo"]))
story.append(numbered([
    "Ir a <b>https://console.cloud.google.com/apis/credentials</b>.",
    "Si nunca configuro pantalla de consentimiento, ir primero a "
    "<i>OAuth consent screen</i>: User type = External, support email = su email, "
    "developer contact = su email. En <i>Audience</i> agregar su email como "
    "<i>Test user</i> mientras la app este en modo Testing.",
    "Volver a <i>Credentials</i> -> <b>Create credentials -> OAuth client ID</b>.",
    "Application type: <b>Web application</b>.",
    "Name: ej. <i>cualautocompro prod</i>.",
    "Authorized JavaScript origins: <i>https://cualautocompro.cl</i>.",
    "Authorized redirect URIs: <i>https://cualautocompro.cl/api/v1/auth/google/callback</i> "
    "(este es <b>BACKEND_ORIGIN + /api/v1/auth/google/callback</b>). "
    "NO usar :443 ni :3000 ni incluir <i>www.</i>",
    "Create. Anotar <b>Client ID</b> y <b>Client secret</b>.",
]))
story.append(Paragraph(
    "Setear en cPanel (Setup Node.js App -> Environment variables):",
    styles["Cuerpo"]))
story.append(code_block(
    "GOOGLE_CLIENT_ID=236383241129-qujrifc5otfpiattfehhsml0t2vm15pe.apps.googleusercontent.com\n"
    "GOOGLE_CLIENT_SECRET=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\n"
    "\n"
    "# Reiniciar la app desde Setup Node.js App para que cargue las envs."))
story.append(callout(
    "<b>NO commitear estos valores en git.</b> El archivo "
    "<i>apps/backend/.env</i> (y .env.development, .env.local) estan "
    "en <i>.gitignore</i>. Si el valor se filtra (ej. push accidental), "
    "<b>rotar el secret inmediatamente</b> desde Google Cloud Console.",
    kind="danger"))

# -----------------------------------------------------------------------------
# 11.4 Apple Developer
# -----------------------------------------------------------------------------
story.append(Paragraph("11.4 Configurar Apple Developer", styles["H2"]))
story.append(Paragraph(
    "Apple es mas complicado que Google. Requiere un App ID, un Service ID, "
    "y un .p8 private key firmado por Apple. Apple solo acepta HTTPS en "
    "redirect URIs, lo cual en produccion es automatico.",
    styles["Cuerpo"]))

story.append(Paragraph("11.4.1 Crear App ID", styles["H3"]))
story.append(numbered([
    "Ir a <b>https://developer.apple.com/account/resources/identifiers</b>.",
    "Click <b>+</b> -> <b>App IDs</b> -> Continue.",
    "Select a Platform (cualquiera sirve para web, pero escoja iOS si tiene app nativa).",
    "Description: <i>cualautocompro web</i>.",
    "Bundle ID: <i>cl.cualautocompro.web</i> (debe ser unico, formato reverse-DNS).",
    "Capabilities: marcar <b>Sign in with Apple</b>.",
    "Continue -> Register.",
]))

story.append(Paragraph("11.4.2 Crear Service ID", styles["H3"]))
story.append(numbered([
    "Volver a <i>Identifiers</i> -> <b>+</b> -> <b>Service IDs</b>.",
    "Description: <i>cualautocompro web prod</i>.",
    "Identifier: <i>cl.cualautocompro.web.prod</i> (otro ID unico).",
    "Capabilities: <b>Sign in with Apple</b> -> Configure.",
    "Primary App ID: el App ID del paso anterior.",
    "Web Domain: <i>cualautocompro.cl</i> (sin https://, sin path).",
    "Return URLs: <i>https://cualautocompro.cl/api/v1/auth/apple/callback</i>.",
    "Save -> Continue -> Register.",
]))

story.append(Paragraph("11.4.3 Crear Private Key (.p8)", styles["H3"]))
story.append(numbered([
    "Ir a <i>Keys</i> -> <b>+</b>.",
    "Key Name: <i>cualautocompro-signin</i>.",
    "Sign in with Apple: marcado -> Configure -> Primary App ID -> Save.",
    "Continue -> Register.",
    "<b>Descargar el .p8</b> (solo se puede descargar una vez - guardar bien).",
    "Anotar <b>Key ID</b> y <b>Team ID</b> (esquina superior derecha del dashboard).",
]))

story.append(Paragraph("11.4.4 Formatear la private key para .env", styles["H3"]))
story.append(callout(
    "Los archivos <i>.env</i> no soportan multilinea. Hay que reemplazar "
    "los saltos de linea del .p8 por <i>\\n</i> literal (no un salto real).",
    kind="warn"))
story.append(code_block(
    "# Extraer el PEM del .p8 (es un .p8 en realidad contiene un PEM dentro)\n"
    "cat AuthKey_XXXXXXXXXX.p8 | base64 -d > key.pem\n"
    "\n"
    "# El archivo suele verse asi:\n"
    "# -----BEGIN PRIVATE KEY-----\n"
    "# MIIEvAIBADANBgkqhkiG9w0BAQEFAAOCB7EwggSsMI...\n"
    "# ...\n"
    "# -----END PRIVATE KEY-----\n"
    "\n"
    "# Escapar saltos de linea para que quepa en una sola linea:\n"
    "PRIVATE_KEY=$(cat key.pem | tr '\\n' '\\\\n')\n"
    "echo \"APPLE_PRIVATE_KEY=\\\"$PRIVATE_KEY\\\""))

story.append(Paragraph("11.4.5 Setear envs de Apple en cPanel", styles["H3"]))
story.append(code_block(
    "APPLE_CLIENT_ID=cl.cualautocompro.web.prod      # el Service ID del paso 11.4.2\n"
    "APPLE_KEY_ID=ABC1234567                          # Key ID del paso 11.4.3\n"
    "APPLE_TEAM_ID=XYZ9876543                         # Team ID del dashboard\n"
    'APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nMIIE...\\n-----END PRIVATE KEY-----"'))
story.append(callout(
    "<b>Importante</b>: el valor de <i>APPLE_PRIVATE_KEY</i> debe tener "
    "comillas dobles en .env porque contiene espacios; los saltos de linea "
    "son <i>\\n</i> literal, no saltos reales.",
    kind="warn"))
story.append(callout(
    "<b>NO commitear</b> este valor. Si el .p8 se filtra, hay que revocarlo "
    "desde Apple Developer inmediatamente.",
    kind="danger"))

# -----------------------------------------------------------------------------
# 11.5 Cookies y SameSite
# -----------------------------------------------------------------------------
story.append(Paragraph("11.5 Cookies, CORS y SameSite en produccion", styles["H2"]))
story.append(Paragraph(
    "El backend setea una cookie httpOnly llamada <i>auth</i> con "
    "configuracion automatica segun el entorno. En produccion:",
    styles["Cuerpo"]))
story.append(code_block(
    "Set-Cookie: auth=<jwt>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800"))
story.append(bullets([
    "<b>HttpOnly</b>: la cookie no es accesible desde JavaScript (mitiga XSS).",
    "<b>Secure</b>: solo se envia sobre HTTPS (obligatorio para OAuth en prod).",
    "<b>SameSite=Lax</b>: protege contra CSRF. Enviar al backend solo en navegaciones top-level y en requests al mismo sitio.",
    "<b>Max-Age=7d</b>: 7 dias. Refresca con cada login OAuth exitoso.",
    "<b>Domain automatico</b>: el backend NO setea Domain en prod. El navegador usa el dominio que la emitio (tipicamente el mismo que sirve el frontend).",
]))
story.append(callout(
    "Si backend y frontend estan en <b>subdominios distintos</b> (por ejemplo "
    "<i>api.cualautocompro.cl</i> y <i>app.cualautocompro.cl</i>) tendra que "
    "editar <i>apps/backend/src/modules/auth/auth-cookie.ts</i> y agregar "
    "<i>domain: '.cualautocompro.cl'</i> (con punto inicial para incluir "
    "subdominios). En este mismo cPanel donde ambos quedan en el mismo host, "
    "no es necesario.",
    kind="info"))

# -----------------------------------------------------------------------------
# 11.6 Verificacion post-deploy
# -----------------------------------------------------------------------------
story.append(Paragraph("11.6 Verificacion post-deploy del OAuth", styles["H2"]))
story.append(Paragraph(
    "Despues del primer deploy con las envs OAuth seteadas, verificar en "
    "orden:",
    styles["Cuerpo"]))
story.append(numbered([
    "<b>Endpoint providers</b>: <i>curl https://cualautocompro.cl/api/v1/auth/providers</i> debe devolver <i>{\"data\":{\"google\":true,\"apple\":false},\"error\":null}</i>. Si devuelve <i>google:false</i>, falta <i>GOOGLE_CLIENT_ID</i> o <i>GOOGLE_CLIENT_SECRET</i>, o la consistencia fallo (envs parciales). Si devuelve 404, falta la migracion Prisma.",
    "<b>Healthcheck del backend</b>: <i>curl https://cualautocompro.cl/health</i> debe devolver <i>{\"status\":\"ok\",...}</i>.",
    "<b>UI en navegador</b>: ir a <i>https://cualautocompro.cl/login</i>. Deben aparecer los botones OAuth en la parte inferior del formulario.",
    "<b>Flujo end-to-end</b>: click en el boton, autorizar, volver al sitio. Verificar: (a) que la cookie <i>auth</i> aparece en DevTools -> Application -> Cookies, (b) que el header del sitio muestra tu email o nombre.",
]))

# -----------------------------------------------------------------------------
# 11.7 Troubleshooting OAuth especifico
# -----------------------------------------------------------------------------
story.append(Paragraph("11.7 Problemas frecuentes especificos de OAuth", styles["H2"]))
story.append(Paragraph(
    "Lista de sintomas especificos de OAuth que pueden aparecer al "
    "desplegar en cPanel. Complementa la seccion 9 ('Problemas "
    "frecuentes') con casos OAuth.",
    styles["Cuerpo"]))

def oauth_problema(titulo, causa, solucion):
    story.append(Paragraph(f"<b>{titulo}</b>", styles["H3"]))
    story.append(Paragraph(f"<b>Causa:</b> {causa}", styles["Cuerpo"]))
    story.append(Paragraph(f"<b>Solucion:</b> {solucion}", styles["Cuerpo"]))

oauth_problema(
    "Pantalla en blanco tras autorizar en Google",
    "Google redirige a <i>BACKEND_ORIGIN/api/v1/auth/google/callback</i> "
    "(puerto 3000 o el interno del servidor). El navegador hace GET a esa URL, "
    "el backend procesa y redirige a <i>WEB_ORIGIN/?oauth=ok</i>. Si <i>WEB_ORIGIN</i> no "
    "esta en <i>https://</i> o no coincide con el origen del frontend, el navegador "
    "rechaza la redireccion o sale de la sesion.",
    "Confirmar que <i>WEB_ORIGIN</i> sea exactamente <i>https://cualautocompro.cl</i> "
    "(sin slash final, sin <i>www</i>). Confirmar que el CDN/proxy de cPanel no "
    "redireccione a otra cosa."),

oauth_problema(
    "redirect_uri_mismatch en Google",
    "La URL registrada en Google Cloud Console no coincide exactamente con "
    "el redirect_uri que el backend pasa al provider. Tipicos errores: tener "
    "<i>http</i> en vez de <i>https</i>, tener <i>www.</i>, haber registrado "
    "el puerto 3000 o el path <i>/oauth/callback</i> (debe ser "
    "<i>/api/v1/auth/google/callback</i>).",
    "Ir a Google Cloud Console -> Credentials -> OAuth client -> Authorized "
    "redirect URIs. Confirmar que diga <i>https://cualautocompro.cl/api/v1/auth/google/callback</i>. "
    "Una sola entrada. Borrar las incorrectas. Esperar 30 segundos (cambios "
    "tardan en propagar) y reintentar."),

oauth_problema(
    "Google muestra pantalla 'App is being verified'",
    "Si la app esta en modo Testing (tipico recien creada) y el email del "
    "usuario NO esta en Test users, Google bloquea con una pantalla de "
    "verificacion.",
    "Agregar el email a <i>OAuth consent screen -> Test users</i>. O publicar "
    "la app (que requiere revision de Google si usa scope sensible - el scope "
    "<i>openid email profile</i> usado aca es NO sensible asi que el proceso "
    "es mas liviano)."),

oauth_problema(
    "Cookie no aparece despues del callback",
    "El browser rechazo aceptar la cookie. Causas: (1) HTTPS no esta "
    "activo en el server (cookie tiene <i>Secure</i> en prod), (2) el "
    "frontend este en otro subdominio sin <i>Domain=</i> configurado, "
    "(3) el browser esta en modo incognito que a veces bloquea cookies de "
    "third-party.",
    "Confirmar que <i>https://</i> sirve correctamente. Verificar en DevTools "
    "-> Network -> el callback retorna una cabecera <i>Set-Cookie: auth=...</i>. "
    "Si retorna pero el browser no la guarda, es problema de <i>Secure</i> "
    "o <i>SameSite</i>."),

oauth_problema(
    "Login funciona pero el usuario no aparece logueado al volver",
    "El callback setea la cookie, redirige al frontend, pero el frontend "
    "no la esta leyendo. Usualmente porque el frontend hace fetch a un "
    "origen distinto al que la cookie pertenece.",
    "Verificar que <i>fetch(... {credentials: 'include'}</i> se este usando "
    "(ApiService ya lo hace). Confirmar que la URL del fetch (vs la URL "
    "de la cookie) comparten scheme + host (el puerto es OK con "
    "<i>Domain=localhost</i> en dev, en prod depender del <i>Domain</i>)."),

oauth_problema(
    "Apple falla con invalid_client o JWT signature invalid",
    "El <i>APPLE_PRIVATE_KEY</i> esta mal. Comunes: (1) el <i>.p8</i> todavia "
    "contiene las lineas envolventes <i>-----BEGIN PRIVATE KEY-----</i> con "
    "saltos reales (deben ser <i>\\n</i> literales), (2) el header/footer fue "
    "truncado al pegar en el panel de cPanel.",
    "Re-generar el string con el comando del 11.4.4. Verificar que en el panel "
    "de cPanel el valor muestre saltos de linea literales (en algunos panels "
    "hay que escapar las comillas manualmente). Probar localmente primero "
    "con <i>APPLE_PRIVATE_KEY</i> en un .env.local."),

oauth_problema(
    "OAUTH_EMAIL_NOT_VERIFIED al login con Google",
    "El usuario de Google tiene email no verificado (tipico cuentas "
    "corporativas con SSO o cuentas nuevas). Google <b>NO</b> autentica "
    "usuarios sin email verificado.",
    "Pedir al usuario que use otra cuenta, o verificar primero el email "
    "en https://myaccount.google.com/email. No hay workaround."),

# -----------------------------------------------------------------------------
# 11.8 Rollback
# -----------------------------------------------------------------------------
story.append(Paragraph("11.8 Como desactivar OAuth si algo falla", styles["H2"]))
story.append(Paragraph(
    "Si despues del deploy algo no anda y queremos volver al login "
    "email/password mientras se investiga:",
    styles["Cuerpo"]))
story.append(numbered([
    "En cPanel -> Setup Node.js App -> Environment variables, dejar vacias o "
    "borrar <i>GOOGLE_CLIENT_ID</i>, <i>GOOGLE_CLIENT_SECRET</i>, "
    "<i>APPLE_CLIENT_ID</i>, <i>APPLE_KEY_ID</i>, <i>APPLE_TEAM_ID</i>, "
    "<i>APPLE_PRIVATE_KEY</i>.",
    "Reiniciar la app desde el panel (boton Restart).",
    "<i>GET /auth/providers</i> ahora devuelve <i>{\"google\":false,\"apple\":false}</i> "
    "y los botones desaparecen del frontend. Login email/password sigue "
    "funcionando normalmente.",
    "La migracion Prisma <i>oauth_identity</i> NO se revierte (no es necesario). "
    "El codigo del backend sigue compilando con el modulo auth disponible.",
    "Para volver a activar: rellenear las envs y reiniciar.",
]))
story.append(callout(
    "Esto es seguro: el codigo de login email/password es independiente de "
    "OAuth. No hay race condition ni estado intermedio que pueda romper "
    "sesiones existentes.",
    kind="success"))

story.append(Spacer(1, 0.6*cm))
story.append(Paragraph(
    "Fin de la guia. Si tiene dudas durante el despliegue, consulte primero la seccion "
    "'Problemas frecuentes' (incluye problemas OAuth en 11.7) y luego a su proveedor de hosting.",
    styles["Caption"]))

# Construccion del PDF
doc = SimpleDocTemplate(
    OUTPUT, pagesize=A4,
    leftMargin=2*cm, rightMargin=2*cm,
    topMargin=2*cm, bottomMargin=2*cm,
    title="Guia de despliegue cualautocompro en cPanel - MariaDB",
    author="Equipo cualautocompro")

doc.build(story, onFirstPage=portada, onLaterPages=header_footer)
print(f"PDF generado: {OUTPUT}")