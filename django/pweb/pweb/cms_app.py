from cms.app_base import CMSApp
from cms.apphook_pool import apphook_pool
from django.utils.translation import ugettext_lazy as _

class PWebSearchApp(CMSApp):
    name = _("pWeb Search App") # give your app a name, this is required

apphook_pool.register(PWebSearchApp) # register your app
