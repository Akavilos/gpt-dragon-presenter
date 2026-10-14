"""Render a consistent portrait with facial states and reversible Galgame motion."""
from pathlib import Path
import math
from PIL import Image, ImageOps

class Presenter:
    def __init__(self, assets):
        self.images={p.stem:Image.open(p).convert('RGBA') for p in Path(assets).glob('*.png')}
        self.cache={}

    def portrait(self, expression, width):
        key=(expression,width)
        if key not in self.cache:
            image=self.images['neutral'].copy()
            if expression!='neutral':
                region=(565,355,935,575)
                image.paste(self.images[expression].crop(region),region[:2])
            self.cache[key]=image.resize((width,width),Image.Resampling.LANCZOS)
        return self.cache[key]

    def draw(self, canvas, t, x, y, width=390, expression='neutral', speaking=False,
             mirrored=False, bounce=0, turn=1):
        if expression=='neutral':
            if t%4.3>4.12:expression='blink'
            elif speaking and math.sin(t*16)>.05:expression='talk'
        image=self.portrait(expression,width)
        if mirrored:image=ImageOps.mirror(image)
        if turn<1:
            image=image.resize((max(1,round(width*turn)),width),Image.Resampling.LANCZOS)
            x+=(width-image.width)/2
        # A common base silhouette prevents drift across generated expression variants.
        bob=math.sin(t*2.5)*4-bounce
        canvas.alpha_composite(image,(round(x),round(y+bob)))
