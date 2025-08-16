#  EatBalance

## 📌 Pasos para Lanzar EatBalance

### 1. Preparación inicial
1. Instala **Visual Studio Code** si no lo tienes.  
2. Abre **VS Code** y desde ahí abre una **terminal**.  
3. Ve a la ruta donde quieras clonar el proyecto (ejemplo: `cd Documents`).  
4. Clona el repositorio:  
  
  **git clone https://github.com/AdamAhmedMohamed/eatbalance-tfg.git**
   
5.Accede a la carpeta del proyecto:
      **cd eatbalance-tfg**

### 2. Configurar y lanzar el Backend

1. Entra en la carpeta del backend:
    **cd  en backend**

2. Crea un entorno virtual:
    **py -3 -m venv venv**

3. Actívalo:
    **venv\Scripts\activate**
   
4. Actualiza pip e instala dependencias:
   **python -m pip install --upgrade pip**
    **pip install -r requirements.txt**

5. Lanza el servidor con Uvicorn:
    **uvicorn main:app --reload**
    (Si no funciona, prueba:
    **python -m uvicorn main:app --reload**)

 6. Se abre el navegador http://127.0.0.1:8000.

Pero Swagger con endpoints: **http://127.0.0.1:8000/docs**

⚠️ Deja esta pestaña abierta y luego abre otra terminal para el frontend.

### 3. Configurar y lanzar el Frontend

1.Abre otra terminal en VS Code.

2.Ve a la carpeta del frontend:
    **cd  en frontend**
    
3. Instala dependencias:
    **npm install**

4. Crea el archivo .env con la URL de la API:
    **Set-Content -Path .env -Value "VITE_API_URL=http://127.0.0.1:8000"**

5. Lanza el frontend:
    **npm run dev**

6. Abre en el navegador el enlace que aparezca (normalmente http://localhost:5173).
7. Puedes usar todas las herramientas de EatBalance.

### 4. Configuración de mensajería con Gmail

1. En el archivo .env del frontend copia y pega al final esto sin la almohadilla:
#  VITE_MAKE_WEBHOOK_URL=https://hook.eu2.make.com/yabbivequlimwlygs1pkcaqipjrndskb**
#   VITE_MAKE_APIKEY=EB_195876a6c9dadf728d5c4a78fdb0acecfc98fe029912cc1a

2. Entra en Make en este enlace:
# 👉 https://eu2.make.com/2487782/scenarios/6795399/edit

3. Inicia sesión con:
 # Usuario: mohamedahmedadam08@gmail.com
 # Contraseña: 23hHeP7*K+%dyJ&

4. Verás un escenario llamado **Integration Webhooks** → pincha en él.
  #  Abajo a la izquierda, dale a Run.

5. # Ahora, desde la página de contacto de EatBalance, rellena el formulario y te llegará un correo de bienvenida de EatBalance al correo que pusiste en el formulario.  
