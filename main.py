import pytesseract 
from PIL import Image

img = Image.open("imagem_cupom.jpg")

text = pytesseract.image_to_string(img)

print (text)