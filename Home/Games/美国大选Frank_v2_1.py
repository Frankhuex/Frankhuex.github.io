import pygame
import numpy as np
from pygame.locals import *

#可调参数
fps=1000000
animation=True
depth=3

screen_wid=500
screen_hei=500
wid=screen_wid/9
unit=wid/10
bwid=wid-2*unit
screen=pygame.display.set_mode((screen_wid,screen_hei))
pygame.display.set_caption("US Election by Frank")
clock=pygame.time.Clock()

RED=(255,0,0)
BLUE=(0,0,255)
WHITE=(255,255,255)
BLACK=(0,0,0)
GREY0=(100,100,100)
GREY1=(130,130,130)
GREY2=(200,200,200)

board=np.array([[[[0,0,0],[0,0,0],[0,0,0]],[[0,0,0],[0,0,0],[0,0,0]],[[0,0,0],[0,0,0],[0,0,0]]],
               [[[0,0,0],[0,0,0],[0,0,0]],[[0,0,0],[0,0,0],[0,0,0]],[[0,0,0],[0,0,0],[0,0,0]]],
               [[[0,0,0],[0,0,0],[0,0,0]],[[0,0,0],[0,0,0],[0,0,0]],[[0,0,0],[0,0,0],[0,0,0]]]])
def mouse():
    return pygame.mouse.get_pos()

def focused(R,C,r,c):
    x=C*wid*3+c*wid
    y=R*wid*3+r*wid    
    if x<=mouse()[0]<=x+wid:
        if y<=mouse()[1]<=y+wid:
            return True
        else:
            return False

def draw_board(board):
    for R in range(3):
        for C in range(3):
            for r in range(3):
                for c in range(3):
                    x=C*wid*3+c*wid
                    y=R*wid*3+r*wid                   
                    if board[R][C][r][c]%10==1:#红
                        color=RED
                    elif board[R][C][r][c]%10==2:#蓝
                        color=BLUE
                    elif board[R][C][r][c]==0:#可下
                        color=GREY2
                        if focused(R,C,r,c):
                            color=GREY1
                    elif board[R][C][r][c]==20:#不可下
                        color=GREY0             
                    pygame.draw.rect(screen,color,(x+unit,y+unit,bwid,bwid))
    for i in range(1,9):
        pygame.draw.line(screen,GREY1,(i*wid,0),(i*wid,screen_wid))
        pygame.draw.line(screen,GREY1,(0,i*wid),(screen_wid,i*wid))
    for i in range(1,3):
        pygame.draw.line(screen,WHITE,(i*wid*3,0),(i*wid*3,screen_wid))
        pygame.draw.line(screen,WHITE,(0,i*wid*3),(screen_wid,i*wid*3))

def print_board(board):
    new_board=np.array([
        [0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0]
        ])
    for row in range(9):
        for col in range(9):
            R=row//3
            C=col//3
            r=row%3
            c=col%3
            new_board[row][col]=board[R][C][r][c]
    for row in range(9):
        print(new_board[row])
    print("\n")

def fill(board,R,C,n):
    for r in range(3):
        for c in range(3):
            board[R][C][r][c]=n+10

def three(board,R,C,n):
    can=False
    for r in range(3):
        rcan=True
        for c in range(3):
            if board[R][C][r][c]!=n:
                rcan=False
                break
        if rcan:
            can=True
            break
    if not can:
        for c in range(3):
            ccan=True
            for r in range(3):
                if board[R][C][r][c]!=n:
                    ccan=False
                    break
            if ccan:
                can=True
                break
    if not can:
        if board[R][C][1][1]==n:
            if board[R][C][0][0]==board[R][C][2][2]==n or board[R][C][2][0]==board[R][C][0][2]==n:
                can=True
    return can

def remain(board):
    result=0
    for R in range(3):
        for C in range(3):
            for r in range(3):
                for c in range(3):
                    if board[R][C][r][c]%10==0:
                        result+=1
    return result

def avail_all(board):
    for R in range(3):
        for C in range(3):
            for r in range(3):
                for c in range(3):
                    if board[R][C][r][c]==20:
                        board[R][C][r][c]=0

def limit(board,Row,Col):
    for R in range(3):
        for C in range(3):
            for r in range(3):
                for c in range(3):
                    if (R!=Row or C!=Col) and board[R][C][r][c]==0:
                        board[R][C][r][c]=20

def put(board,R,C,r,c,n):
    board[R][C][r][c]=n
    if three(board,R,C,n):
        fill(board,R,C,n)
    avail_all(board)
    if board[r][c][0][0]//10!=1:
        limit(board,r,c)

def cpumax(board,R,C,r,c,n,depth):
    if depth==0:
        return 0    
    else:
        board1=board.copy()
        board1[R][C][r][c]=n
        if remain(board1)==0 or three(board1,R,C,n):
            return -10000
        else:
            put(board1,R,C,r,c,n)
            if animation:
                draw_board(board1)
                pygame.display.update()
                clock.tick(fps)
            best_score=-float("inf")
            for R1 in range(3):
                for C1 in range(3):
                    for r1 in range(3):
                        for c1 in range(3):
                            if board1[R1][C1][r1][c1]==0:
                                score=cpumin(board1,R1,C1,r1,c1,3-n,depth-1)
                                if score>best_score:
                                    best_score=score
            return best_score

def cpumin(board,R,C,r,c,n,depth):
    if depth==0:
        return 0    
    else:
        board1=board.copy()
        board1[R][C][r][c]=n
        if remain(board1)==0 or three(board1,R,C,n):
            return 10000
        else:
            put(board1,R,C,r,c,n)
            if animation:
                draw_board(board1)
                pygame.display.update()
                clock.tick(fps)
            best_score=float("inf")
            for R1 in range(3):
                for C1 in range(3):
                    for r1 in range(3):
                        for c1 in range(3):
                            if board1[R1][C1][r1][c1]==0:
                                score=cpumax(board1,R1,C1,r1,c1,3-n,depth-1)
                                if score<best_score:
                                    best_score=score          
            return best_score
            
def game(board):
    global run    
    run=True
    while run:
        screen.fill((0,0,0))
        draw_board(board)
        pygame.display.update()
        clock.tick(fps)
        for event in pygame.event.get():
            if event.type==pygame.QUIT:
                run=False
                return
            elif event.type==pygame.MOUSEBUTTONDOWN and remain(board)>0:
                for R in range(3):
                    for C in range(3):
                        for r in range(3):
                            for c in range(3):
                                if focused(R,C,r,c):
                                    if board[R][C][r][c]==0:
                                        put(board,R,C,r,c,1)
                                        print(remain(board))
                                        if remain(board)>0:                                            
                                            best_score=-float("inf")
                                            for R1 in range(3):
                                                for C1 in range(3):
                                                    for r1 in range(3):
                                                        for c1 in range(3):
                                                            if board[R1][C1][r1][c1]==0: 
                                                                score=cpumin(board,R1,C1,r1,c1,2,depth)
                                                                if score>best_score:
                                                                    best_R,best_C,best_r,best_c,best_score=R1,C1,r1,c1,score    
                                            put(board,best_R,best_C,best_r,best_c,2)
                                            #print_board(board)
                                            print(remain(board))
                        
def main():
    game(board)
    pygame.quit()

main()