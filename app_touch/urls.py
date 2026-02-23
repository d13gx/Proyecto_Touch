from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views


router = DefaultRouter()
router.register(r'mapas', views.MapaViewSet)
router.register(r'ubicaciones', views.UbicacionViewSet)

urlpatterns = [
    # URLs existentes
    path('api/auth/csrf/', views.get_csrf_token, name='get_csrf_token'),
    path('api/auth/login/', views.login_ad, name='login_ad'),
    path('api/auth/logout/', views.logout_view, name='logout_view'),
    path('api/auth/check/', views.check_auth, name='check_auth'),
    
    path('api/ldap/search/', views.search_ldap, name='search_ldap'),
    path('api/ldap/trabajador/', views.trabajador_detail_ldap, name='trabajador_detail_ldap'),
    path('api/ldap/departamento/', views.departamento_detail_ldap, name='departamento_detail_ldap'),
    # =========================================================================
    # SERVICIOS & UTILIDADES
    # =========================================================================
    path('api/enviar-correo/', views.enviar_correo, name='enviar_correo'),  # ✅ SOLO UNA VEZ
    path('api/trabajador-ldap/', views.trabajador_detail_ldap, name='trabajador_ldap'),  # ✅ Para compatibilidad
     # ✅ NUEVAS URLS PARA DEPARTAMENTOS
    # ✅ NUEVAS URLs JERARQUÍA
    path('api/arbol-jerarquico/', views.get_arbol_jerarquico, name='arbol_jerarquico'),
    path('api/lista-departamentos/', views.get_lista_departamentos, name='lista_departamentos'),
    path('api/departamento/<str:nombre_departamento>/', views.get_departamento_detalle, name='departamento_detalle'),
    path('api/resumen-organizacion/', views.get_resumen_organizacion, name='resumen_organizacion'),
        # NUEVA VISTA - Agregar esta línea
    path('api/departamento-completo/', views.departamento_completo, name='departamento_completo'),
    
    
    # ========== NUEVAS URLs ==========
    path('api/security/config/', views.get_security_config, name='security-config'),
    path('api/security/report-zoom/', views.report_zoom_attempt, name='report-zoom'),
    
    
    # 1. Health Check y Monitoreo
    path('api/health/', views.health_check, name='health_check'),
    path('api/stats/cache/', views.get_estadisticas_cache, name='get_estadisticas_cache'),
    
    # 2. Gestión de Cache (solo desarrollo/staff)
    path('api/admin/cache/limpiar-ldap/', views.limpiar_cache_ldap, name='limpiar_cache_ldap'),
      

    # URLs de viewsets
    path('api/', include(router.urls)),
]