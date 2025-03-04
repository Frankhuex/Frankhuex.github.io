import pygame
from FivePiece import *
from Const import *
from Draw import *
from Button import *
from Selector import *

pygame.init()
pygame.display.set_caption("FivePiece5.0")

screen=pygame.display.set_mode((SCREENSIZE,SCREENSIZE))
fps=120
clock=pygame.time.Clock()

def createbutton(xrate,yrate,text):
    return Button(xrate,yrate,text,TEXTHEI,WHITE,None,BUTTONWID,BUTTONHEI,BLUE,SCREENSIZE,SCREENSIZE)

def createselector(hash):
    for key in hash:
        button=hash[key]
        hash[key]=(button.buttonx,button.buttony,button.buttonwid,button.buttonhei)
    return Selector(hash)


def initialize(run):  
    board=[[0 for _ in range(19)] for _ in range(19)]
    current_player=1
    single=True
    last_row=last_col=-1
    playing=True
    help_AI=True

    b1=createbutton(1/3,1/4,"Single")
    b2=createbutton(2/3,1/4,"Double")
    b3=createbutton(1/3,1/2,"Black")
    b4=createbutton(2/3,1/2,"White")
    b5=createbutton(1/2,3/4,"PLAY!")
    s1=createselector({"Single":b1,"Double":b2})
    s2=createselector({"Black":b3,"White":b4})
    while run[0]:
        screen.fill(YELLOW)
        for b12 in (b1,b2,s1):
            b12.draw(screen)
        if s1.selected=="Single":
            for b34 in (b3,b4,s2):
                b34.draw(screen)
            if s2.selected!=None:
                b5.draw(screen)
        elif s1.selected=="Double":
            b5.draw(screen)
        pygame.display.update()
        clock.tick(fps)
        for event in pygame.event.get():
            if event.type==pygame.MOUSEBUTTONDOWN:
                if b1.focused():
                    s1.selected="Single"
                    single=True
                elif b2.focused():
                    s1.selected="Double"
                    s2.selected=None
                    board[9][9]=0
                    single=False
                    current_player=1
                    last_row=last_col=-1
                elif s1.selected=="Single":
                    if b3.focused():
                        s2.selected="Black"
                        board[9][9]=0
                        current_player=1
                        last_row=last_col=-1
                    elif b4.focused():
                        s2.selected="White"
                        board[9][9]=1
                        current_player=2
                        last_row=last_col=9
                    elif b5.focused() and s2.selected!=None: 
                        return board,current_player,single,last_row,last_col,playing,help_AI
                elif s1.selected=="Double" and b5.focused():
                    return board,current_player,single,last_row,last_col,playing,help_AI
            elif event.type==pygame.QUIT:
                run[0]=False
                return None,None,None,None,None,None,None

def replaywarn(run,board,current_player,single,last_row,last_col,playing,help_AI):
    b1=createbutton(1/3,1/2,"Replay")
    b2=createbutton(2/3,1/2,"Continue")
    while run:
        screen.fill(YELLOW)
        b1.draw(screen)
        b2.draw(screen)
        pygame.display.update()
        clock.tick(fps)
        for event in pygame.event.get():
            if event.type==pygame.MOUSEBUTTONDOWN:
                if b1.focused():
                    return initialize(run)
                elif b2.focused():
                    return board,current_player,single,last_row,last_col,playing,help_AI
            elif event.type==pygame.QUIT:
                run[0]=False
                return None,None,None,None,None,None,None

def game(run):
    board,current_player,single,last_row,last_col,playing,help_AI=initialize(run)
    while run[0]:
        mouse_x,mouse_y=pygame.mouse.get_pos()
        mouse_row=xy2cr(mouse_y,BLOCKSIZE)
        mouse_col=xy2cr(mouse_x,BLOCKSIZE)

        screen.fill(YELLOW)
        drawboard(board,screen,BLOCKSIZE)
        if (last_row!=-1 and last_col!=-1):
            drawlast(last_row,last_col,screen,BLOCKSIZE)

        if playing:
            drawtarget(board,mouse_row,mouse_col,current_player,screen,BLOCKSIZE)
            drawmouse(current_player,screen,BLOCKSIZE)
        pygame.display.update()
        clock.tick(fps)
        for event in pygame.event.get():
            if event.type==pygame.QUIT:
                run[0]=False
                #return
            elif event.type==pygame.KEYDOWN:
                if event.key==pygame.K_1:
                    print(basicscore(board,mouse_row,mouse_col,3-current_player))
                if event.key==pygame.K_r:
                    board,current_player,single,last_row,last_col,playing,help_AI=replaywarn(run,board,current_player,single,last_row,last_col,playing,help_AI)
            elif playing and event.type==pygame.MOUSEBUTTONDOWN:
                if board[mouse_row][mouse_col]==0 and not (current_player==1 and banned(board,mouse_row,mouse_col,current_player)):
                    board[mouse_row][mouse_col]=current_player
                    last_row,last_col=mouse_row,mouse_col
                    drawboard(board,screen,BLOCKSIZE)
                    drawlast(last_row,last_col,screen,BLOCKSIZE)
                    if ifwin(board):
                        playing=False
                        continue
                    if not single:
                        current_player=3-current_player
                    else:
                        if help_AI:
                            AI_row,AI_col=helpAI(board,3-current_player)
                            help_AI=False
                        else:
                            AI_row,AI_col=AI(board,3-current_player,0)
                        last_row,last_col=AI_row,AI_col
                        board[AI_row][AI_col]=3-current_player
                        if ifwin(board):
                            playing=False
                            continue

def main():
    game([True])

main()


  