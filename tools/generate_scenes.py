import random, math, os
from PIL import Image, ImageDraw, ImageFont
W,H=128,192
BK=(12,28,26);D1=(30,58,52);D2=(46,84,70);D3=(78,128,104);GD=(24,104,60);GM=(44,196,98);G=(38,253,117)
Y1=(96,112,104);Y2=(138,156,146);Y3=(184,198,190);WH=(214,224,217);SK=(176,146,120);BR=(112,74,44);BD=(72,46,28)
B4=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]]
bay=lambda x,y:(B4[y%4][x%4]+.5)/16
def fnt(sz):
    for p in('/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf','/usr/share/fonts/dejavu/DejaVuSansMono-Bold.ttf'):
        if os.path.exists(p):return ImageFont.truetype(p,sz)
class S:
    def __init__(s,bg=D1):
        s.im=Image.new('RGB',(W,H),bg);s.p=s.im.load();s.d=ImageDraw.Draw(s.im);s.d.fontmode="1"
    def px(s,x,y,c):
        if 0<=x<W and 0<=y<H:s.p[x,y]=c
    def r(s,x0,y0,x1,y1,c):s.d.rectangle((x0,y0,x1,y1),fill=c)
    def grad(s,y0,y1,c1,c2):
        for y in range(y0,y1+1):
            t=(y-y0)/max(1,y1-y0)
            for x in range(W):s.px(x,y,c2 if t>bay(x,y) else c1)
    def halo(s,cx,cy,rad,k=1.0,strong=G):
        for y in range(max(0,cy-rad),min(H,cy+rad+1)):
            for x in range(max(0,cx-rad),min(W,cx+rad+1)):
                t=(1-math.hypot(x-cx,(y-cy)*1.15)/rad)*k
                if t>0 and t**1.2>bay(x,y):s.px(x,y,strong if t>.6 else GM if t>.3 else GD)
    def vines(s,x0,x1,y0,y1):
        for i in range(x0,x1,2):
            ph=random.random()*6
            for y in range(y0,y1):
                s.px(i+int(2*math.sin(y/4+ph)),y,random.choice([GD,GD,GM]))
                if random.random()<.03:s.px(i+1+int(2*math.sin(y/4+ph)),y,G)
    def leaves(s,n,xr,yr,cols=None):
        for _ in range(n):
            x=random.randint(*xr);y=random.randint(*yr);s.d.ellipse((x,y,x+random.randint(3,8),y+random.randint(2,4)),fill=random.choice(cols or (GD,GM,GD)))
    def save(s,name,grain=140):
        for _ in range(grain):
            x,y=random.randrange(W),random.randrange(H);c=s.p[x,y];s.p[x,y]=tuple(max(0,v-6) for v in c)
        s.im.save(f'assets/scenes/{name}.png')
random.seed(7)
def canopy(s,n):
    for _ in range(n):
        x=random.choice([random.randint(0,30),random.randint(98,127)]);y=random.choice([random.randint(0,24),random.randint(150,191)])
        w=random.randint(6,16);h=random.randint(4,9);c=random.choice([GD,GM,GD,GM,G])
        s.d.ellipse((x,y,x+w,y+h),fill=c);s.d.ellipse((x+2,y+1,x+w-2,y+h-3),fill=GD if c!=GD else GM)
def courtyard():
    s=S(BK);s.grad(0,66,(54,112,120),(168,222,190))
    pass
    s.r(0,64,127,191,D2)
    s.r(46,36,82,62,D1);s.r(44,33,84,36,Y1)
    for x in range(49,81,6):s.r(x,42,x+3,45,G if x%12==1 else GD)
    s.d.polygon([(0,8),(34,24),(34,191),(0,191)],fill=D1)
    for yy in range(40,170,13):
        for xx in(6,16,26):s.r(xx,yy,xx+3,yy+5,G if random.random()<.12 else D3)
    s.r(0,92,12,122,BK);s.r(0,92,1,122,Y2);s.r(4,95,8,120,GM);s.halo(6,106,14,.8)
    s.r(96,18,127,191,D2)
    for x in range(98,128,8):s.r(x,18,x+1,191,GM)
    for y in range(18,150,16):s.r(96,y,127,y+1,GM)
    for y in range(18,191):
        for x in range(98,128):
            if bay(x,y)<.16 and (x-98)%8>1 and (y-18)%16>1:s.px(x,y,GD)
    s.r(114,92,127,122,BK);s.halo(120,106,14,.8)
    for y in range(64,192):
        t=(y-64)/127;h=int(4+t*52);st=max(3,int(3+t*9))
        for x in range(64-h,64+h+1):s.px(x,y,D3 if (abs(x-64)>h-2 or y%st==0) else Y1)
    for y in range(72,190,10):s.px(64,y,GM)
    s.halo(64,62,30);s.r(62,59,66,64,G);s.halo(64,66,56,.45)
    s.leaves(50,(0,34),(110,191));s.leaves(50,(94,125),(120,191));s.leaves(14,(36,92),(176,191))
    canopy(s,45);s.save('courtyard')
def alcove():
    s=S(BK);s.r(0,0,127,130,BK)
    for row,y in enumerate(range(0,130,7)):
        for x in range(-(row%2)*6,W,12):s.r(x+1,y+1,x+11,y+6,random.choice([D2,D3,D2,Y1]))
    s.grad(130,191,Y1,BK);s.r(98,10,112,60,Y1);s.r(100,12,110,58,BK);s.halo(105,35,40,.9)
    s.halo(100,176,24,.6);s.r(28,120,62,123,Y2);s.r(32,123,34,130,Y1);s.r(56,123,58,130,Y1)
    s.r(78,142,106,168,Y2);s.r(78,142,106,146,Y3)
    for y in(152,158,164):s.r(78,y,106,y,Y1)
    s.r(6,150,62,176,Y2);s.r(10,154,58,174,GD);s.r(8,150,22,157,Y3)
    s.vines(2,14,0,50);s.leaves(16,(0,30),(40,70))
    canopy(s,35);s.save('alcove')
def local():
    s=S(BK);s.grad(0,150,D2,D1)
    for y in(14,22,30):s.r(0,y,127,y+2,Y1);s.r(0,y,127,y,Y2)
    s.r(4,60,22,160,Y1);s.r(6,64,20,90,D1)
    for y in(70,80):s.d.ellipse((9,y,17,y+6),fill=GM)
    s.r(34,68,54,90,Y2);s.r(34,68,54,70,Y3)
    for x in(38,44,50):s.r(x,78,x+2,80,G if x==44 else GD)
    s.r(92,26,127,102,Y1);s.r(95,29,127,100,BK);s.halo(112,64,36,.9);s.vines(96,127,29,100)
    s.r(60,128,120,134,Y3);s.r(60,134,120,160,Y1);s.r(62,160,66,176,Y1);s.r(114,160,118,176,Y1)
    s.grad(160,191,Y1,BK)
    for x in range(0,128,16):s.r(x,162,x,191,D1)
    canopy(s,30);s.save('local')
def tram():
    s=S(BK);s.grad(0,100,(54,112,120),(168,222,190))
    x=0
    while x<128:
        w=random.randint(8,16);h=random.randint(14,40);s.r(x,100-h,x+w,100,D1);x+=w+random.randint(0,3)
    s.grad(150,191,D2,D1)
    for x in range(0,128,10):s.r(x,156,x+4,186,Y1)
    s.r(0,160,127,162,Y3);s.r(0,180,127,182,Y3)
    s.r(10,74,127,150,Y1);s.r(10,74,127,80,GD);s.r(10,80,127,80,G)
    for x in range(16,64,14):
        s.r(x,88,x+9,108,BK)
        for y in range(88,109):
            for xx in range(x,x+10):
                if bay(xx,y)<.22:s.px(xx,y,GD)
    s.r(100,88,124,108,BK);s.r(66,112,92,148,Y2);s.r(68,114,90,148,BK)
    s.r(70,120,88,132,D1)
    for i,yy in enumerate((122,125,128,131)):s.r(71,yy,71+random.randint(6,15),yy,G)
    s.halo(78,129,18,.8)
    for cx in(24,52,120):s.d.ellipse((cx-7,142,cx+7,158),fill=BK,outline=Y2)
    s.r(91,153,111,169,Y2);s.r(91,153,111,154,Y3)
    for xx in range(95,111,4):s.r(xx,155,xx,168,D1)
    canopy(s,30);s.save('tram')
def greenhouse():
    s=S(D1);s.grad(0,150,D2,D1);s.halo(30,14,46,.5,GM)
    for x in range(0,128,21):s.r(x,0,x+2,150,Y1)
    for y in(40,80,120):s.r(0,y,127,y+1,Y1)
    for y in range(0,150):
        for x in range(128):
            if bay(x,y)<.12 and x%21>2 and y%40>1:s.px(x,y,GD)
    for _ in range(18):
        x=random.randint(0,127);s.vines(x,x+2,0,random.randint(24,80))
    s.halo(92,108,32,.7,GM);s.grad(150,191,D1,BK)
    s.r(70,124,116,130,Y2);s.r(70,124,116,124,Y3);s.r(22,146,50,149,Y3);s.r(24,149,26,166,Y1);s.r(46,149,48,166,Y1)
    s.leaves(40,(0,40),(136,191));s.leaves(40,(80,125),(140,191));s.leaves(12,(40,80),(170,191),(GD,GD,GM,G))
    for x in(10,58,108):s.d.rectangle((x,170,x+10,184),fill=BD);s.leaves(5,(x-2,x+8),(160,172))
    canopy(s,25);s.save('greenhouse')
def karmen():
    s=S(BK)
    for row,y in enumerate(range(40,150,7)):
        for x in range(-(row%2)*6,W,12):s.r(x+1,y+1,x+11,y+6,random.choice([D1,D2,D1,D3]))
    s.grad(150,191,Y1,BK);s.halo(64,28,50,.8)
    f=fnt(15)
    for t,y in(("KARMEN",8),("CAMINA",26)):
        s.d.text((38,y+1),t,font=f,fill=GD);s.d.text((37,y),t,font=f,fill=G)
    s.r(34,46,94,47,G)
    for x in range(30,100,5):s.r(x,160,x,172+x%7,GD)
    s.r(28,106,48,152,Y2);s.r(30,108,46,152,BK);s.r(31,148,45,151,G);s.halo(38,150,16,.6)
    s.r(84,54,114,112,Y1);s.r(86,56,112,112,BK);s.vines(87,112,56,112);s.halo(99,84,24,.6)
    s.r(72,152,100,170,Y2)
    for x in range(75,100,4):s.r(x,154,x,169,BK)
    s.r(54,100,70,130,Y3);s.d.text((55,108),"20.",font=fnt(8),fill=BK);s.d.text((55,117),"11",font=fnt(8),fill=BK)
    canopy(s,40);[(s.d.text((38,y+1),t,font=f,fill=GD),s.d.text((37,y),t,font=f,fill=G)) for t,y in(("KARMEN",8),("CAMINA",26))];s.save('karmen')
def final():
    global BK,D1,D2,D3,GD,GM,Y1,Y2,Y3
    BK=(3,6,5);D1=(7,14,11);D2=(13,26,19);D3=(21,42,30);GD=(11,66,38);GM=(22,148,74);Y1=(38,46,42);Y2=(68,78,72);Y3=(108,118,111)
    s=S(BK)
    def beam(poly,k):
        m=Image.new('L',(W,H));ImageDraw.Draw(m).polygon(poly,fill=255);q=m.load()
        for y in range(H):
            for x in range(W):
                if q[x,y] and bay(x,y)<k*(1-y/H*.6):s.px(x,y,GM if random.random()<.85 else G)
    beam([(30,0),(2,150),(58,150)],.3);beam([(98,0),(70,150),(126,150)],.3);beam([(64,0),(40,150),(88,150)],.22)
    s.r(2,70,24,136,Y1);s.r(104,70,126,136,Y1)
    for y in(76,96,116):
        s.d.ellipse((6,y,20,y+14),fill=D1,outline=Y2);s.d.ellipse((108,y,122,y+14),fill=D1,outline=Y2)
    s.r(14,128,114,138,Y2);s.r(14,138,114,150,D1)
    s.halo(64,115,38);s.d.ellipse((58,109,70,121),fill=G);s.d.ellipse((61,112,67,118),fill=WH)
    for fx,hold in((42,True),(86,False)):
        s.d.ellipse((fx-3,104,fx+3,110),fill=BK);s.r(fx-4,110,fx+4,128,BK)
        if hold:s.d.ellipse((fx+2,112,fx+8,118),fill=GM)
    for x in range(-4,132,7):
        y=random.randint(158,174);s.d.ellipse((x,y,x+6,y+6),fill=BK);s.r(x-2,y+6,x+8,200,BK);s.px(x+3,y,GM)
        if random.random()<.45:s.d.line((x+3,y+6,x+random.randint(-4,10),y-random.randint(6,14)),fill=BK,width=2)
    for _ in range(40):s.px(random.randint(10,118),random.randint(20,150),G)
    s.save('final')
for f in(courtyard,alcove,local,tram,greenhouse,karmen,final):f()
names=['courtyard','alcove','local','tram','greenhouse','karmen','final']
sheet=Image.new('RGB',(4*(W*2+8),2*(H*2+8)),(20,28,22))
for i,n in enumerate(names):sheet.paste(Image.open(f'assets/scenes/{n}.png').resize((W*2,H*2),Image.NEAREST),((i%4)*(W*2+8),(i//4)*(H*2+8)))
sheet.save('/tmp/scenes_v3.png')
