# 5. Análisis y registro de riesgos

> Riesgos del **proyecto y del producto** (los riesgos de seguridad técnica por escenario están en el [modelo de amenazas](04-modelo-amenazas.md)). Escala 1–5. Responsable: rol, no persona (aún no hay equipo asignado).

| ID | Categoría | Riesgo | P | I | Tratamiento | Responsable | Indicador de alerta |
|---|---|---|---|---|---|---|---|
| R-01 | Alcance | El alcance (7 módulos + lenguaje + hardware + IA) excede la capacidad de un equipo inicial; nada llega a producción con calidad | 5 | 5 | Fasear estrictamente; v1 = ID + VAULT + TRUST + PDP con CIPHER-policy mínimo. Hardware y SENTINEL completo después | Fundador / CTO | Más de 2 módulos en desarrollo simultáneo antes de Fase 2 |
| R-02 | Seguridad | Error en la composición criptográfica (nonces, AAD, contexto) | 3 | 5 | Revisión de criptógrafo externo antes de cualquier dato real; vectores de prueba; fuzzing diferencial | Líder de criptografía | Formato de objeto cambiado sin revisión |
| R-03 | Seguridad | CIPHER introduce una superficie de ataque nueva (bugs de compilador = bugs de autorización) | 4 | 5 | Lenguaje mínimo y total; IR verificable; evaluador de referencia + fuzzing diferencial; verificación formal del evaluador en Fase 3 | Líder de lenguajes | Funciones añadidas que rompen totalidad |
| R-04 | Seguridad | La IA ejecuta acciones dañinas por inyección | 5 | 4 | ADR-0004; confirmación humana firmada; sin herramientas de egress | Líder IA | Herramienta añadida sin revisión de seguridad |
| R-05 | Regulatorio | Tratamiento de biometría (GDPR art. 9, BIPA en Illinois, leyes LATAM) | 3 | 5 | Biometría sólo local; DPIA para verificación documental; asesoría legal por jurisdicción | Legal / DPO | Petición comercial de "almacenar huellas" |
| R-06 | Regulatorio | Requisitos de residencia de datos y soberanía para infraestructura crítica | 4 | 4 | Despliegue regional y on-prem; HYOK | Producto | Cliente objetivo en jurisdicción no soportada |
| R-07 | Regulatorio | Controles de exportación de criptografía | 2 | 4 | Revisión legal (p. ej. EAR en EE. UU., Wassenaar) antes de distribución internacional | Legal | Venta a nuevos países |
| R-08 | Técnico | Inmadurez de bibliotecas PQC y soporte en HSM | 4 | 3 | Híbrido (la parte clásica sigue protegiendo); agilidad; seguimiento de validaciones FIPS | Criptografía | Bibliotecas sin auditoría pública |
| R-09 | Técnico | Rendimiento del PDP en la ruta crítica de cada petición | 3 | 3 | Políticas compiladas, evaluación en proceso (sidecar/librería), caché de decisiones con TTL corto | Arquitectura | p99 > 5 ms |
| R-10 | Operacional | Fail-closed del PDP/HSM provoca indisponibilidad total | 3 | 4 | Alta disponibilidad; break-glass auditado; pruebas de caos | SRE | Incidentes de disponibilidad |
| R-11 | Operacional | Fatiga de alertas / falsos positivos en SENTINEL causan desactivación por parte del cliente | 4 | 3 | Umbrales por tenant; métricas de precisión; acciones automáticas sólo reversibles | Detección | Tasa de alertas descartadas > 80% |
| R-12 | Operacional | Respuesta automática destructiva (aislar el servidor equivocado) | 3 | 4 | Clasificación de acciones por reversibilidad; aprobación humana para impacto alto; listas de activos protegidos | Detección | Acción automática revertida |
| R-13 | Negocio | Competir contra plataformas consolidadas con presupuestos enormes | 5 | 4 | Nicho inicial: PYMEs/medianas reguladas en un mercado concreto; integrarse en lugar de reemplazar | Fundador | CAC/ciclo de venta |
| R-14 | Negocio | Coste de certificaciones (SOC 2, ISO 27001, FIPS 140-3, CC) | 4 | 3 | Planificar presupuesto; empezar por SOC 2 Type I / ISO 27001 | Fundador | — |
| R-15 | Hardware | Coste y plazo del dispositivo físico (NRE, certificación, cadena de suministro) | 5 | 4 | Posponer a Fase 4; empezar con hardware COTS (HSM USB/llaves FIDO) | Fundador | Compromisos comerciales sobre hardware antes de Fase 3 |
| R-16 | Personas | Dependencia de pocas personas clave en criptografía/lenguajes | 4 | 4 | Documentación, revisión cruzada, consultores externos | CTO | Bus factor = 1 |
| R-17 | Reputacional | Marketing que promete "inhackeable" o "seguridad cuántica" | 3 | 5 | Política de comunicación revisada por seguridad; afirmaciones sólo con evidencia | Fundador | Material comercial sin revisión |
| R-18 | Seguridad | Recuperación de cuenta como vector de toma de control | 4 | 5 | Recuperación con periodo de espera, notificación a todos los dispositivos y aprobación de custodio | ID | Tickets de soporte que saltan el flujo |
| R-19 | Seguridad | Pérdida irreversible de datos por pérdida de shares de recuperación del cliente | 2 | 5 | Ceremonia guiada, verificación periódica de shares ("prueba de custodia"), recomendaciones de distribución | VAULT | Shares no verificados en 12 meses |
| R-20 | Técnico | Dependencia de proveedor LLM externo (privacidad, disponibilidad, cambios de modelo) | 4 | 3 | Abstracción de proveedor; modelo autohospedado para tenants críticos; evaluación de regresión por versión de modelo | IA | Cambio de modelo sin re-evaluación |

## Riesgos aceptados explícitamente (propuesta, requiere decisión del fundador)

- **Endpoint comprometido en sesión activa** puede leer lo que el usuario autorizado ve (mitigado, no eliminado).
- **Proveedor cloud malicioso** en modo SaaS estándar: mitigado sólo por BYOK/HYOK y despliegue on-prem.
- **Coerción de M custodios simultáneos** no es mitigable por medios técnicos.
