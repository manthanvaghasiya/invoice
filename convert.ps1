Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile("public\WhatsApp_Image.jpeg")
$img.Save("public\WhatsApp_Image.png", [System.Drawing.Imaging.ImageFormat]::Png)
$img.Dispose()
