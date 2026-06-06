package protocols.voltaire.nomad

import android.app.Activity
import android.os.Bundle
import android.widget.TextView

class MainActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val title = TextView(this).apply {
            text = "Nomad Wallet\nVoltaire Protocols"
            textSize = 22f
            setPadding(32, 64, 32, 32)
        }

        setContentView(title)
    }
}
