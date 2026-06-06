package protocols.voltaire.nomad

import android.app.Activity
import android.os.Bundle
import android.widget.LinearLayout
import android.widget.TextView
import protocols.voltaire.nomad.di.NomadServiceContainer

/**
 * Nomad Android development entry screen.
 *
 * This screen intentionally avoids async wallet calls until the native Android
 * Gradle build is fully activated with audited dependencies.
 */
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
            setPadding(0, 24, 0, 0)
            text = buildString {
                appendLine("Android-native Nomad scaffold")
                appendLine("Foundation: Samourai-inspired wallet architecture")
                appendLine("Upgrade layer: Clock Unlock, Travel Mode, Blockpages411 safety")
                appendLine()
                appendLine("Current phase: development wiring")
                appendLine("Production wallet engine: pending audit")
                appendLine()
                append(services.developmentSafetyReport.toDisplayText())
            }
        }

        layout.addView(title)
        layout.addView(status)
        setContentView(layout)
    }
}
