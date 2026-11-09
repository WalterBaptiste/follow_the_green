import random
from PIL import Image, ImageDraw
random.seed(5)
BK=(3,6,5);GD=(11,66,38);GM=(22,148,74);G=(38,253,117);WH=(228,236,230);Y1=(52,62,58);Y2=(100,112,104);Y3=(170,184,176);BR=(112,74,44);BD=(72,46,28)
def mk(w,h,fn):
    im=Image.new('RGBA',(w,h),(0,0,0,0));d=ImageDraw.Draw(im);fn(d);p=im.load();o=im.copy();q=o.load()
    for y in range(h):
        for x in range(w):
            if p[x,y][3]==0:
                for dx,dy in((1,0),(-1,0),(0,1),(0,-1)):
                    a,b=x+dx,y+dy
                    if 0<=a<w and 0<=b<h and p[a,b][3]:q[x,y]=BK+(255,);break
    return o
def camera(d):
    d.rectangle((4,11,22,25),fill=Y1);d.rectangle((4,11,22,13),fill=Y2);d.ellipse((1,12,14,25),fill=BK,outline=G);d.ellipse((4,15,11,22),fill=GD);d.rectangle((6,16,7,17),fill=WH)
    d.rectangle((23,12,29,19),fill=Y2);d.rectangle((24,13,28,18),fill=G);d.rectangle((18,8,22,11),fill=Y1);d.rectangle((19,14,20,15),fill=G);d.line((8,26,24,26),fill=GM)
def secateur(d):
    d.line((3,28,16,15),fill=GM,width=4);d.line((6,29,17,17),fill=GD,width=2);d.line((16,15,28,5),fill=Y3,width=3);d.line((16,15,28,11),fill=WH,width=2);d.ellipse((14,13,18,17),fill=Y2)
def casque(d):
    d.arc((5,3,27,27),180,360,fill=Y3,width=3);d.rectangle((3,12,10,24),fill=G);d.rectangle((5,14,8,22),fill=GD);d.rectangle((22,12,29,24),fill=G);d.rectangle((24,14,27,22),fill=GD)
    d.rectangle((12,22,20,28),fill=Y1);d.rectangle((14,24,18,26),fill=BK)
def poster(d):
    d.rectangle((6,3,26,29),fill=WH);d.rectangle((6,3,26,10),fill=G);d.rectangle((9,13,23,14),fill=Y2);d.rectangle((9,17,23,18),fill=Y2);d.rectangle((9,21,18,22),fill=Y2);d.rectangle((13,1,19,4),fill=Y3)
RED=(168,30,40);HAIR=(40,26,22);HH=(76,52,40);GOLD=(222,176,60)
def driia(d):
    d.ellipse((5,1,30,17),fill=HAIR);d.ellipse((3,9,12,28),fill=HAIR);d.ellipse((24,9,33,28),fill=HAIR)
    for _ in range(40):d.point((random.randint(4,32),random.randint(3,27)),fill=HH)
    d.ellipse((11,7,25,21),fill=(196,150,122));d.rectangle((16,20,20,24),fill=(196,150,122));d.rectangle((14,12,15,13),fill=BK);d.rectangle((21,12,22,13),fill=BK);d.line((16,17,20,17),fill=(140,70,64))
    d.arc((7,16,13,24),0,360,fill=GOLD,width=1);d.line((14,24,22,24),fill=GOLD)
    d.polygon([(8,25),(28,25),(32,44),(4,44)],fill=RED)
    for y in range(26,44,2):
        for x in range(6 if y%4 else 7,31,3):d.point((x,y),fill=(90,12,20))
    d.polygon([(13,25),(23,25),(18,33)],fill=BK);d.rectangle((9,44,26,48),fill=BK);d.rectangle((9,48,16,51),fill=Y1);d.rectangle((19,48,26,51),fill=Y1)
    d.rectangle((29,28,31,36),fill=Y2);d.ellipse((28,25,32,29),fill=Y3)
def regie(d):
    d.pieslice((9,1,27,15),180,360,fill=G);d.rectangle((8,8,28,10),fill=GM);d.ellipse((11,8,25,21),fill=(150,106,78));d.rectangle((14,13,15,14),fill=BK);d.rectangle((21,13,22,14),fill=BK);d.line((16,18,20,18),fill=BK)
    d.polygon([(6,23),(30,23),(33,46),(3,46)],fill=Y2);d.polygon([(6,23),(11,23),(8,46),(3,46)],fill=Y1)
    d.arc((9,18,27,34),0,180,fill=BK,width=2);d.ellipse((7,27,12,34),fill=BK);d.ellipse((24,27,29,34),fill=BK)
    d.polygon([(18,31),(20,36),(25,36),(21,39),(23,44),(18,41),(13,44),(15,39),(11,36),(16,36)],fill=G)
    d.rectangle((9,46,15,51),fill=Y1);d.rectangle((21,46,27,51),fill=Y1)
for n,f,sz in(('glasses',camera,(32,32)),('knife',secateur,(32,32)),('walkman',casque,(32,32)),('poster',poster,(32,32)),('driia',driia,(36,52)),('regie',regie,(36,52))):
    mk(*sz,f).save(f'assets/sprites/{n}.png')
sheet=Image.new('RGB',(6*150,230),(120,170,130))
for i,n in enumerate(('glasses','knife','walkman','poster','driia','regie')):
    im=Image.open(f'assets/sprites/{n}.png');b=im.resize((im.width*4,im.height*4),Image.NEAREST);sheet.paste(b,(i*150+4,10),b)
sheet.save('/tmp/sprites_v3.png')
