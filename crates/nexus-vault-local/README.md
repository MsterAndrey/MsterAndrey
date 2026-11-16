# nexus-vault-local

El **motor** de NEXUS CUBE Desktop: un almacén cifrado en el disco del equipo, con una carpeta por cliente o
por caso ([ADR-0011](../../docs/adr/ADR-0011-compartimentos-legales-por-cliente-o-caso.md)), versiones que nunca
se sobrescriben y recuperación a un instante dado. Cifra con [`nexus-envelope`](../nexus-envelope/).

> **Prototipo. No auditado. No usar con datos reales.** El único almacén de claves disponible,
> `DevFileKeyStore`, guarda las claves en archivos **sin protección de hardware**. El almacén con
> TPM 2.0 ([ADR-0012](../../docs/adr/ADR-0012-tpm-2-obligatorio.md)) es el siguiente paso.

## Qué garantiza (y qué prueba lo comprueba)

| Propiedad | Prueba |
|---|---|
| Ni el contenido, ni los nombres de archivo, ni el nombre de la carpeta aparecen en disco | `nada_en_claro_en_disco` |
| Guardar una versión nueva no modifica ningún archivo existente | `las_versiones_son_inmutables` |
| Recuperar a un instante escribe en una carpeta nueva y no toca lo actual | `restaurar_a_un_instante_en_carpeta_nueva` |
| Un nombre como `../x` no puede escribir fuera de la carpeta de recuperación | `nombres_con_rutas_se_rechazan` |
| Un archivo cifrado alterado se detecta | `contenido_manipulado_se_detecta` |
| Copiar un objeto de la carpeta de un cliente a la de otro no funciona | `mover_objetos_entre_carpetas_falla` |
| Borrar la versión más reciente del índice para «volver atrás» se detecta | `rollback_del_indice_se_detecta` |
| Editar o borrar entradas del registro de actividad se detecta, y el almacén no se abre | `el_registro_detecta_ediciones_y_borrados` |
| El registro no contiene nombres de archivos ni de clientes | `el_registro_no_contiene_nombres` |
| Sin la clave correcta de la carpeta no se descifra nada | `sin_la_clave_correcta_no_se_descifra` |

## Estructura en disco

```text
vault.json                                  organización (sin secretos)
audit.log                                   registro encadenado con SHA-256 (sólo identificadores)
compartments/<carpeta>/manifest/v<N>.ncobj  índice cifrado: nombres y versiones
compartments/<carpeta>/objects/<obj>/v<N>.ncobj  contenido cifrado de cada versión
```

## Limitaciones conocidas
- Claves en archivo (`DevFileKeyStore`): sólo desarrollo.
- El registro local detecta ediciones y borrados intermedios, pero **no** que alguien recorte las últimas
  entradas: eso requiere los testigos externos de NEXUS TRUST ([ADR-0006](../../docs/adr/ADR-0006-auditoria-log-transparencia.md)).
- Archivos en memoria (hasta 256 MiB, límite de `nexus-envelope`); sin cifrado por bloques todavía.
- Un solo proceso a la vez; sin bloqueo entre procesos.
- La recuperación en el producto debe pasar antes por la confirmación con Windows Hello (lo hará la aplicación).
