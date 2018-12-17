# For testing on Android with Web IDE and a USB connection
# See https://developer.mozilla.org/en-US/docs/Tools/Remote_Debugging/Debugging_Firefox_for_Android_with_WebIDE
# and https://developer.mozilla.org/en-US/docs/Tools/WebIDE/Troubleshooting
# and https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Developing_WebExtensions_for_Firefox_for_Android
rm duplicateTab@skeletonxf.github.io.xpi
zip -r duplicateTab@skeletonxf.github.io.xpi .
adb push duplicateTab@skeletonxf.github.io.xpi /mnt/sdcard/
