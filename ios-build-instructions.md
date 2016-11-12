### Install Facebook
**Reference:** http://ngcordova.com/docs/plugins/facebook/

cordova plugin add https://github.com/Wizcorp/phonegap-facebook-plugin.git --variable APP_ID="786521788124677" --variable APP_NAME="La Reta"


Set to Portrait only


Allow Insecure Domains
http://ste.vn/2015/06/10/configuring-app-transport-security-ios-9-osx-10-11/

On the Info.plist file, add:

<key>NSAppTransportSecurity</key>
<dict>
  <key>NSExceptionDomains</key>
  <dict>
    <key>api.laretaapp.com</key>
    <dict>
      <!--Include to allow subdomains-->
      <key>NSIncludesSubdomains</key>
      <true/>
      <!--Include to allow HTTP requests-->
      <key>NSTemporaryExceptionAllowsInsecureHTTPLoads</key>
      <true/>
      <!--Include to specify minimum TLS version-->
      <key>NSTemporaryExceptionMinimumTLSVersion</key>
      <string>TLSv1.1</string>
    </dict>
  </dict>
</dict>