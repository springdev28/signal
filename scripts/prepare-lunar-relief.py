"""Derive browser relief from NASA LOLA unsigned half-metre elevations.
Input: complete ldem_16_uint.tif from NASA SVS CGI Moon Kit 4720.
R = 1,737,400 m; stored height = (radius - R + 10,000 m) * 2.
Normal derivatives account for longitude convergence. No invented craters.
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image
im=Image.open(sys.argv[1]);im.load()
height=np.asarray(im,dtype=np.float32)*.5-10000
height=np.asarray(Image.fromarray(height).resize((4096,2048),Image.Resampling.BILINEAR),dtype=np.float32)
h,w=height.shape;radius=1737400
lat=np.pi/2-(np.arange(h)+.5)/h*np.pi
step_x=2*np.pi*radius/w*np.maximum(.05,np.cos(lat))[:,None];step_y=np.pi*radius/h
# Image y grows south; texture v grows north.
dx=(np.roll(height,-1,axis=1)-np.roll(height,1,axis=1))/(2*step_x)
dy=(np.roll(height,1,axis=0)-np.roll(height,-1,axis=0))/(2*step_y)
normal=np.stack((-dx,-dy,np.ones_like(height)),axis=-1);normal/=np.linalg.norm(normal,axis=-1,keepdims=True)
out=Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
Image.fromarray(np.uint8(np.clip(normal*.5+.5,0,1)*255)).save(out/'moon-normal.webp',quality=95,method=6)
# Fixed documented -11 km .. +11 km range, preserves height in geometry.
Image.fromarray(np.uint8(np.clip((height+11000)/22000,0,1)*255)).save(out/'moon-height.webp',lossless=True,method=6)
print('LOLA',im.size,'elevation range m',float(height.min()),float(height.max()),'output',w,h)
