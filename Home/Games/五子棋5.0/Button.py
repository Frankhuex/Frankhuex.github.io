import pygame
class Button:
    def __init__(self,xrate,yrate,
                 text,texthei,textcolor,font,
                 buttonwid,buttonhei,buttoncolor,
                 screenwid,screenhei
                 ):
        self.xrate=xrate
        self.yrate=yrate

        self.text=text
        self.texthei=texthei
        self.textcolor=textcolor
        self.font=font

        self.buttonwid=buttonwid
        self.buttonhei=buttonhei
        self.buttoncolor=buttoncolor

        self.screenwid=screenwid
        self.screenhei=screenhei

        self.refresh()

        
    def refresh(self):
        self.centerx=self.screenwid*self.xrate
        self.centery=self.screenhei*self.yrate

        self.buttonx=self.centerx-self.buttonwid/2
        self.buttony=self.centery-self.buttonhei/2

        self.textimage=pygame.font.Font(self.font,self.texthei).render(self.text,True,self.textcolor)
        self.textwid=self.textimage.get_width()
        self.texthei=self.textimage.get_height()
        self.textx=self.centerx-self.textwid/2
        self.texty=self.centery-self.texthei/2
    
    def focused(self):
        mousex,mousey=pygame.mouse.get_pos()
        if (self.buttonx<=mousex<=self.buttonx+self.buttonwid):
            if (self.buttony<=mousey<=self.buttony+self.buttonhei):
                return True
        return False

    def draw(self,screen):
        buttoncolor=self.buttoncolor
        if self.focused():
            buttoncolor=(min(buttoncolor[0]+50,255),min(buttoncolor[1]+50,255),min(buttoncolor[2]+50,255))
        pygame.draw.rect(screen,buttoncolor,(self.buttonx,self.buttony,self.buttonwid,self.buttonhei),border_radius=2)
        screen.blit(self.textimage,(self.textx,self.texty))