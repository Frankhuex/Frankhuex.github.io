import pygame
from Const import *
from FivePiece import *
def drawonepiece(x,y,current_player,screen,blocksize):
    if current_player==1:
        pygame.draw.circle(screen,BLACK,(x,y),blocksize/2.1,0)
    elif current_player==2:
        pygame.draw.circle(screen,WHITE,(x,y),blocksize/2.1,0)
        pygame.draw.circle(screen,BLACK,(x,y),blocksize/2.1,1)

def drawpieces(board,screen,blocksize):
    for row in range(19):
        for col in range(19):
            if board[row][col]>0:
                x=cr2xy(col,blocksize)
                y=cr2xy(row,blocksize)
                drawonepiece(x,y,board[row][col],screen,BLOCKSIZE)

def drawboard(board,screen,blocksize):
    for row in range(1,20):
        pygame.draw.rect(screen,BLACK,(blocksize,row*blocksize,18*blocksize,1))
        pygame.draw.rect(screen,BLACK,(row*blocksize,blocksize,1,18*blocksize))
    for row in [4,10,16]:
        for column in [4,10,16]:
            pygame.draw.circle(screen,BLACK,(row*blocksize,column*blocksize),3,0)   
    drawpieces(board,screen,blocksize)

def drawlast(last_row,last_col,screen,blocksize):
    x=(last_col+1)*blocksize
    y=(last_row+1)*blocksize
    r=blocksize/2.1
    pygame.draw.circle(screen,RED,(x,y),r,1)   
    pygame.draw.circle(screen,RED,(x,y),r/2,1)  
    pygame.draw.line(screen,RED,(x,y-r),(x,y+r),1)
    pygame.draw.line(screen,RED,(x-r,y),(x+r,y),1)

def drawmouse(current_player,screen,blocksize):
    x,y=pygame.mouse.get_pos()
    drawonepiece(x,y,current_player,screen,blocksize)
    
    

def drawtarget(board,row,col,current_player,screen,blocksize):
    if board[row][col]==0:
        x=cr2xy(col,blocksize)
        y=cr2xy(row,blocksize)
        r=blocksize/2.1
        if current_player==1 and banned(board,row,col,current_player):
            pygame.draw.circle(screen,RED,(x,y),r,1)        
        else:
            pygame.draw.circle(screen,GREY,(x,y),r,1) 