"""Genera datos de ventas ficticios (con errores típicos) para probar el proyecto.

Salida:
  datos/ventas_ejemplo.xlsx  -> hojas "Ventas" (datos sucios) y "Config"
  datos/ventas_ejemplo.csv   -> la misma hoja Ventas en CSV

Uso: python scripts/generar_datos.py
"""
import csv
import random
from datetime import date, timedelta
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill

random.seed(7)
RAIZ = Path(__file__).resolve().parent.parent
SALIDA = RAIZ / "datos"
SALIDA.mkdir(exist_ok=True)

SUCURSALES = ["Providencia", "Ñuñoa", "Maipú", "La Florida"]
VENDEDORES = {
    "Providencia": ["Camila Rojas", "Diego Soto"],
    "Ñuñoa": ["Valentina Muñoz", "Tomás Díaz"],
    "Maipú": ["Javiera Pérez", "Matías Fuentes"],
    "La Florida": ["Fernanda Silva", "Benjamín Reyes"],
}
PRODUCTOS = {
    "Café": [("Café en grano 1 kg", 14990), ("Café molido 500 g", 7990), ("Cápsulas x10", 4990)],
    "Accesorios": [("Prensa francesa", 19990), ("Molinillo manual", 24990), ("Filtros x100", 3490)],
    "Pastelería": [("Kuchen de nuez", 12990), ("Alfajores x6", 5990), ("Brownie", 2490)],
    "Bebidas": [("Té chai 250 g", 6490), ("Chocolate caliente", 5490)],
}
PESO_SUCURSAL = {"Providencia": 1.4, "Ñuñoa": 1.1, "Maipú": 0.9, "La Florida": 0.8}


def ensuciar_texto(t):
    r = random.random()
    if r < 0.06:
        return "  " + t.upper() + " "
    if r < 0.12:
        return t.lower() + "  "
    return t


def ensuciar_precio(p):
    r = random.random()
    if r < 0.15:
        return f"${p:,.0f}".replace(",", ".")
    if r < 0.2:
        return f"{p:,.0f}".replace(",", ".")
    return p


filas = []
boleta = {s: 1000 * (i + 1) for i, s in enumerate(SUCURSALES)}
inicio, fin = date(2026, 1, 1), date(2026, 10, 31)
d = inicio
while d <= fin:
    estacional = 1.25 if d.month in (6, 7, 8) else 1.0
    crecimiento = 1 + (d.month - 1) * 0.03
    for suc in SUCURSALES:
        n = max(0, int(random.gauss(4 * PESO_SUCURSAL[suc] * estacional * crecimiento, 1.3)))
        for _ in range(n):
            boleta[suc] += 1
            cat = random.choices(list(PRODUCTOS), weights=[5, 2, 3, 2])[0]
            prod, precio = random.choice(PRODUCTOS[cat])
            cant = random.choices([1, 2, 3, 4], weights=[60, 25, 10, 5])[0]
            fecha = d.strftime("%d/%m/%Y") if random.random() < 0.3 else d.isoformat()
            filas.append([fecha, boleta[suc], ensuciar_texto(suc), random.choice(VENDEDORES[suc]), cat,
                          ensuciar_texto(prod), cant, ensuciar_precio(precio)])
    d += timedelta(days=1)

# Errores típicos: duplicados, filas vacías e incompletas
for f in random.sample(filas, 25):
    filas.insert(random.randrange(len(filas)), list(f))
for _ in range(8):
    filas.insert(random.randrange(len(filas)), [""] * 8)
for _ in range(6):
    malo = list(random.choice(filas))
    malo[random.choice([6, 7])] = random.choice(["", "-", "sin dato"])
    filas.insert(random.randrange(len(filas)), malo)

ENCABEZADO = ["Fecha", "Boleta", "Sucursal", "Vendedor", "Categoria", "Producto", "Cantidad", "PrecioUnitario"]

with open(SALIDA / "ventas_ejemplo.csv", "w", newline="", encoding="utf-8") as fh:
    w = csv.writer(fh)
    w.writerow(ENCABEZADO)
    w.writerows(filas)

wb = Workbook()
ws = wb.active
ws.title = "Ventas"
ws.append(ENCABEZADO)
for f in filas:
    ws.append(f)
for c in ws[1]:
    c.font = Font(bold=True, color="FFFFFF")
    c.fill = PatternFill("solid", fgColor="1D2433")

cfg = wb.create_sheet("Config")
cfg.append(["Clave", "Valor"])
cfg.append(["NombreEmpresa", "Café Aroma (ejemplo)"])
cfg.append(["HojaDatos", "Ventas"])
cfg.append(["Destinatarios", "tu_correo_personal@gmail.com"])
cfg.append(["Asunto", "Reporte mensual de ventas"])
for c in cfg[1]:
    c.font = Font(bold=True)
cfg.column_dimensions["A"].width = 18
cfg.column_dimensions["B"].width = 40

wb.save(SALIDA / "ventas_ejemplo.xlsx")
print(f"{len(filas)} filas generadas en {SALIDA}")
