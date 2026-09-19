import pygame
from Const import *
class Selector:
    def __init__(self,hash={}):
        self.hash=hash
        self.selected=None
    def addchoice(self,key,rect):
        self.hash[key]=rect
    def draw(self,screen):
        if self.selected!=None and self.selected in self.hash:
            rect=self.hash[self.selected]
            pygame.draw.rect(screen,RED,rect,5)
