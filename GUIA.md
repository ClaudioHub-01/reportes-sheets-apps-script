# Guía: instalar y probar el proyecto (15–20 minutos)

> **Importante:** usa tu **cuenta personal de Google** (Gmail), no la cuenta de la USACH.

## Paso 1: Subir la planilla

1. Entra a [drive.google.com](https://drive.google.com) con tu cuenta personal.
2. Arrastra el archivo `datos/ventas_ejemplo.xlsx`.
3. Haz clic derecho sobre el archivo → **Abrir con** → **Hojas de cálculo de Google**.
4. Ve a **Archivo** → **Guardar como Hojas de cálculo de Google**. Trabaja sobre esa copia.

## Paso 2: Configurar

En la hoja **Config**, cambia `Destinatarios` por tu correo personal. Puedes poner varios, separados por coma.

## Paso 3: Pegar el código

1. En la planilla, ve a **Extensiones** → **Apps Script**.
2. Borra el contenido de `Código.gs`.
3. Crea 4 archivos con el botón **+** → **Secuencia de comandos**: `Limpieza`, `Calculos`, `Reporte` y `Menu`.
4. Pega en cada uno el contenido del archivo con el mismo nombre de la carpeta `src/`. Puedes borrar el `Código.gs` vacío.
5. Para el archivo de permisos:
   - Ve a **Configuración del proyecto** (ícono de engranaje).
   - Marca **Mostrar el archivo de manifiesto "appsscript.json" en el editor**.
   - Vuelve al editor y reemplaza el contenido de `appsscript.json` por el de `src/appsscript.json`.
6. Guarda con **Ctrl+S**.

## Paso 4: Primera ejecución

1. Vuelve a la planilla y recárgala (F5). Aparece el menú **Reportes**.
2. Ve a **Reportes** → **Generar resumen**.
3. Google pide permisos. Elige tu cuenta.
   - Si aparece "Google no verificó esta app", haz clic en **Configuración avanzada** → **Ir a … (no seguro)** → **Permitir**.
   - Es normal: el script es tuyo y solo funciona en tu planilla.
4. Se crean las hojas **Datos limpios**, **Resumen** y **Registro**.

## Paso 5: Enviar y programar

1. Ve a **Reportes** → **Enviar reporte ahora** y revisa tu correo: debe llegar el resumen con el PDF adjunto.
2. Ve a **Reportes** → **Programar envío mensual** para dejarlo automático. Puedes quitarlo cuando quieras con **Quitar envío programado**.

## Paso 6: Capturas para el portafolio

Toma estas 3 capturas con `Win + Shift + S` y guárdalas en `docs/`:

| Archivo | Qué mostrar |
|---|---|
| `docs/resumen.png` | La hoja **Resumen** completa, con el gráfico. |
| `docs/menu.png` | El menú **Reportes** abierto. |
| `docs/correo.png` | El correo recibido, con el PDF adjunto visible. Tapa tu dirección de correo si quieres. |

Luego sube la carpeta a GitHub como un repositorio nuevo, igual que los proyectos anteriores. Nombre sugerido: `reportes-sheets-apps-script`.

## Si algo falla

| Error | Solución |
|---|---|
| `No existe la hoja "Ventas"` | Revisa que la hoja se llame exactamente `Ventas`, o cambia `HojaDatos` en Config. |
| `Agrega al menos un correo…` | Completa `Destinatarios` en Config. |
| No aparece el menú Reportes | Recarga la planilla. Revisa que el código esté guardado. |
| Error de permisos al enviar | Revisa que `appsscript.json` sea el del proyecto y vuelve a autorizar. |
