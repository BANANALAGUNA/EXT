MODPATH="${0%/*}"

# pifwebui patch: open the WebUI (device list) when launched from the Magisk app
if [ ! -f "$MODPATH/skipwebui" ] && [ "$MMRL" != "true" ] && [[ -n "$MAGISKTMP" || "$TMPDIR" = *"magisk"* ]]; then
    if pm path io.github.a13e300.ksuwebui >/dev/null 2>&1; then
        echo "- Launching WebUI in KSUWebUIStandalone ..."
        am start -n "io.github.a13e300.ksuwebui/.WebUIActivity" -e id "playintegrityfix"
        exit 0
    fi
    if pm path com.dergoogler.mmrl.wx >/dev/null 2>&1; then
        echo "- Launching WebUI in WebUI X ..."
        am start -n "com.dergoogler.mmrl.wx/.ui.activity.webui.WebUIActivity" -e MOD_ID "playintegrityfix"
        exit 0
    fi
fi

# ensure not running in busybox ash standalone shell
if [ -n "$ASH_STANDALONE" ]; then
    set +o standalone
    unset ASH_STANDALONE
fi

[ -f "$MODPATH/skipmatchdevice" ] || MATCHFLAG=-m

[ -f "$MODPATH/skipmenu" ] || MENUFLAG=-l
sh $MODPATH/autopif4.sh $MATCHFLAG $MENUFLAG || exit 1

echo -e "\nDone!"

# warn since KernelSU/APatch's implementation automatically closes if successful
if [ "$KSU" = "true" -o "$APATCH" = "true" ] && [ "$KSU_NEXT" != "true" ] && [ "$KSU_SUKISU" != "true" ] && [ "$WKSU" != "true" ] && [ "$MMRL" != "true" ]; then
    echo -e "\nClosing dialog in 20 seconds ..."
    sleep 20
fi
