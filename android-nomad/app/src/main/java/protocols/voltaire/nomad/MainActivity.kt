package protocols.voltaire.nomad

import android.app.Activity
import android.os.Bundle
import android.widget.LinearLayout
import android.widget.TextView
import protocols.voltaire.nomad.di.NomadServiceContainer

class MainActivity : Activity() {
    private val services = NomadServiceContainer()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(32, 64, 32, 32)
        }

        val title = TextView(this).apply {
            text = "Nomad Wallet\nVoltaire Protocols"
            textSize = 24f
        }

        val status = TextView(this).apply {
            textSize = 16f
            text = "Loading Nomad development services..."
            setPadding(0, 24, 0, 0)
        }

        layout.addView(title)
        layout.addView(status)
        setContentView(layout)

        Thread {
            val home = kotlinx.coroutines.runBlocking {
                services.homeController.loadHome()
            }

            runOnUiThread {
                status.text = buildString {
                    appendLine("Wallet status: ${home.walletStatus}")
                    appendLine("Travel Mode: ${if (home.travelModeState.enabled) "Enabled" else "Disabled"}")
                    appendLine("Safety: ${home.safetySummary.title}")
                    appendLine(home.safetySummary.message)
                    appendLine()
                    appendLine("Quick actions:")
                    home.quickActions.forEach { action ->
                        appendLine("- ${action.label}: ${if (action.enabled) "enabled" else "disabled"}")
                    }
                }
            }
        }.start()
    }
}
