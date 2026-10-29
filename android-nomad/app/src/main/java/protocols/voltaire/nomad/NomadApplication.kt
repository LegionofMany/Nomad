package protocols.voltaire.nomad

import android.app.Application

class NomadApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        // Nomad native services will be initialized here.
    }
}
