const RADAR_EDITIONS = [
  {
    "id": "2026-11-27",
    "period": "21–27 noviembre 2026 · corte: 27/11",
    "pattern": "Dos brechas destacan por el compromiso de identidades de desarrollo y la conexión entre repositorios, automatización y producción. El riesgo no termina en el código: alcanza los secretos y el plano de control.",
    "action": "Revisar permisos de GitHub Actions, proteger cambios de workflows, usar OIDC y credenciales efímeras de alcance mínimo, y comprobar la exposición de servicios administrativos. Parchear y buscar indicios de compromiso cuando exista explotación activa.",
    "items": [
      {
        "name": "1Password",
        "type": "breach",
        "date": "25 nov · comunicado",
        "incident": "Investigación iniciada el 19 nov",
        "vector": "Cuenta corporativa de GitHub comprometida; cambios maliciosos en backend.",
        "impact": "Nombres, emails y metadatos de un subconjunto de clientes. Según la empresa, las bóvedas y sus contenidos no fueron afectados.",
        "lesson": "Proteger identidades de desarrollo, ramas y despliegues; limitar el alcance de las credenciales. Usuarios: vigilar phishing.",
        "tags": [
          "GitHub",
          "CI/CD",
          "identidad"
        ],
        "sources": [
          [
            "Comunicado de 1Password",
            "https://1password.com/blog/update-on-nov-2026-security-incident"
          ]
        ]
      },
      {
        "name": "Todoist",
        "type": "breach",
        "date": "24 nov · actualizado 26 nov",
        "incident": "22–23 nov",
        "vector": "Credencial del control de versiones robada; manipulación de workflows y escalada hasta producción.",
        "impact": "Aprox. 6% de usuarios: emails y hashes SHA-1 antiguos con sal. Un grupo mucho menor sufrió exposición de tokens o datos de integraciones.",
        "lesson": "Retirar hashes heredados, reducir permisos de CI, rotar secretos expuestos y separar identidades de despliegue y administración.",
        "tags": [
          "CI/CD",
          "SHA-1",
          "cloud"
        ],
        "sources": [
          [
            "Postmortem de Todoist",
            "https://www.todoist.com/help/todoist/get-started/security-incident-in-november-2026-cG0EIACNU"
          ]
        ]
      },
      {
        "name": "Juniper",
        "type": "exploit",
        "date": "25–26 nov · alerta de explotación",
        "incident": "Parche publicado el 28 oct; explotación comunicada el 24 nov",
        "vector": "CVE-2026-103406: inyección de comandos sin autenticación en Session Smart Conductor.",
        "impact": "Posible ejecución de comandos como root y riesgo para el plano de gestión SD-WAN.",
        "lesson": "Actualizar según el fabricante, restringir acceso a gestión y revisar indicios de compromiso.",
        "tags": [
          "CVE-2026-103406",
          "SD-WAN",
          "RCE"
        ],
        "sources": [
          [
            "Aviso MS-ISAC",
            "https://www.cisecurity.org/advisory/multiple-vulnerabilities-in-juniper-products-could-allow-for-arbitrary-code-execution_2026-143"
          ],
          [
            "CSIRT Panamá",
            "https://cert.pa/?p=6407"
          ]
        ]
      },
      {
        "name": "Drupal",
        "type": "exploit",
        "date": "25 nov · aviso",
        "incident": "Explotación en curso según Drupal",
        "vector": "CVE-2026-136716: bypass en el instalador bajo determinados estados del sitio.",
        "impact": "Posible toma de control de sitios vulnerables, incluso tras un parche anterior.",
        "lesson": "Actualizar, bloquear acceso al instalador y auditar actividad administrativa; parchear no descarta un compromiso previo.",
        "tags": [
          "CVE-2026-136716",
          "access bypass",
          "web"
        ],
        "sources": [
          [
            "Avisos oficiales de Drupal",
            "https://www.drupal.org/security/core/advisories"
          ],
          [
            "NHS Cyber Alert",
            "https://digital.nhs.uk/cyber-alerts/2026/cc-4905"
          ]
        ]
      },
      {
        "name": "Danfoss",
        "type": "watch",
        "date": "25 nov · cobertura de alerta",
        "incident": "Aviso del fabricante: 20 nov",
        "vector": "CVE-2026-129713: desbordamiento de búfer sin autenticación en controladores AK-SM 8xxA.",
        "impact": "Reinicio del servidor y posible ejecución de código. Contexto de ataques recientes a refrigeración en Europa; no atribuir todos al mismo CVE.",
        "lesson": "Eliminar exposición directa a Internet, usar redes protegidas y seguir el estado de la actualización del fabricante.",
        "tags": [
          "CVE-2026-129713",
          "OT",
          "refrigeración"
        ],
        "sources": [
          [
            "Aviso de Danfoss",
            "https://www.danfoss.com/en/service-and-support/coordinated-vulnerability-disclosure/danfoss-security-advisories/dsa-2026-12-01/"
          ],
          [
            "Cobertura de la alerta CISA",
            "https://www.bleepingcomputer.com/news/security/cisa-warns-of-critical-unpatched-flaw-in-danfoss-refrigeration-controllers/"
          ]
        ]
      },
      {
        "name": "Renfe",
        "type": "watch",
        "date": "Comunicado consultado 27 nov · fecha de publicación no verificada",
        "incident": "Acceso el 24 sep, según Renfe",
        "vector": "Acceso no autorizado a sistemas relacionados con la venta de billetes; vía inicial no detallada.",
        "impact": "Posible exposición de datos personales; alcance en investigación. Caso anterior incluido como seguimiento, no ataque nuevo de esta semana.",
        "lesson": "No asumir qué datos fueron robados; seguir las comunicaciones oficiales y vigilar posibles intentos de suplantación.",
        "tags": [
          "España",
          "datos personales",
          "seguimiento"
        ],
        "sources": [
          [
            "Notificación de Renfe",
            "https://www.renfe.com/es/es/ayuda/notificacion-personas-afectadas.html"
          ]
        ]
      }
    ]
  }
];
