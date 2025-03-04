def ifcontinuous(board, n):
    size = len(board)
    # horizontal
    for r in range(size):
        count = 0
        player = 0
        for c in range(size):
            if board[r][c] == 0:
                count = 0
            elif board[r][c] == player:
                count += 1
                if count == n:
                    return player
            else:
                count = 1
            player = board[r][c]

    # vertical
    for c in range(size):
        count = 0
        player = 0
        for r in range(size):
            if board[r][c] == 0:
                count = 0
            elif board[r][c] == player:
                count += 1
                if count == n:
                    return player
            else:
                count = 1
            player = board[r][c]

    # rightdown (lower triangle)
    for r in range(size-4):
        count = 0
        player = 0
        for c in range(size-r):
            if board[r + c][c] == 0:
                count = 0
            elif board[r + c][c] == player:
                count += 1
                if count == n:
                    return player
            else:
                count = 1
            player = board[r + c][c]

    # right down (upper triangle)
    for c in range(size-4):
        count = 0
        player = 0
        for r in range(size-c):
            if board[r][r+c] == 0:
                count = 0
            elif board[r][r+c] == player:
                count += 1
                if count == n:
                    return player
            else:
                count = 1
            player = board[r][r+c]

    # rightup (upper triangle)
    for r in range(4, size):
        count = 0
        player = 0
        for c in range(r+1):
            if board[r - c][c] == 0:
                count = 0
            elif board[r - c][c] == player:
                count += 1
                if count == n:
                    return player
            else:
                count = 1
            player = board[r - c][c]

    # rightup (lower triangle)
    for c in range(0, size-4):
        count = 0
        player = 0
        for r in range(c,size):
            if board[r][size-1-r+c] == 0:
                count = 0
            elif board[r][size-1-r+c] == player:
                count += 1
                if count == n:
                    return player
            else:
                count = 1
            player = board[r][size-1-r+c]

    return 0



def ifwin(board):
    return ifcontinuous(board,5)



def xy2cr(xy, block_size):
    if xy < block_size:
        cr = 0
    elif xy > 19 * block_size:
        cr = 18
    else:
        cr = (int(xy) + block_size // 2) // block_size - 1  # 使用整除来确保结果是整数
    return int(cr)

def cr2xy(cr,block_size):
    return (cr+1)*block_size

# 0.right,1.rightup,2.up,3.leftup,4.left,5.leftdown,6.down,7.rightdown

def changerow(row, dir):
    if dir in (5, 6, 7):
        return row + 1
    elif dir in (1, 2, 3):
        return row - 1
    else:
        return row
    
def changecol(col, dir):
    if dir in (0, 1, 7):
        return col + 1
    elif dir in (3, 4, 5):
        return col - 1
    else:
        return col

def changerowcol(row, col, dir):
    return changerow(row, dir), changecol(col, dir)

def overboard(row, col):
    return not (0 <= row <= 18 and 0 <= col <= 18)

def basicspread1(board, row, col, current_player, dir):
    spread = 0
    row, col = changerowcol(row, col, dir)
    # 由于changerowcol返回新的行和列值，我们需要在循环中更新它们
    while (not overboard(row, col)) and board[row][col] == current_player:
        spread += 1
        # 更新row和col的值
        row, col = changerowcol(row, col, dir)
    return spread

def livespread1(board, row, col, current_player, dir, canjump):
    spread = 0
    # 更新row和col的值
    row, col = changerowcol(row, col, dir)
    while (not overboard(row, col)) and board[row][col] == current_player:
        spread += 1
        # 再次更新row和col的值以便下一次迭代
        row, col = changerowcol(row, col, dir)
    
    if (not overboard(row, col)) and board[row][col] == 0:
        if canjump:
            # 递归调用livespread1，注意这里不需要返回值
            jump_spread = livespread1(board, row, col, current_player, dir, False)
            if jump_spread != -1:
                spread += jump_spread
    else:
        # 如果遇到对手的棋子，spread设置为-1
        spread = -1
    
    return spread

def deadspread1(board, row, col, current_player, dir, canjump):
    spread = 0
    # 更新row和col的值
    row, col = changerowcol(row, col, dir)
    while (not overboard(row, col)) and board[row][col] == current_player:
        spread += 1
        # 再次更新row和col的值以便下一次迭代
        row, col = changerowcol(row, col, dir)
    
    if (not overboard(row, col)) and board[row][col] == 0:
        if canjump:
            # 递归调用deadspread1
            jump_spread = deadspread1(board, row, col, current_player, dir, False)
            if jump_spread == -1:
                spread = -1  # 活棋
            else:
                spread += jump_spread
        else:
            spread = -1  # 活棋    
    return spread

def basicspread2(board, row, col, current_player, dir):
    dir2 = (dir + 4) % 8  # 计算第二个方向
    # 沿两个方向计算连续棋子数，然后加1
    return basicspread1(board, row, col, current_player, dir) + \
           basicspread1(board, row, col, current_player, dir2) + 1

def livespread2(board, row, col, current_player, dir):
    dir2 = (dir + 4) % 8  # 计算第二个方向
    # 计算四个方向上的跳跃和非跳跃传播
    canjump1 = livespread1(board, row, col, current_player, dir, True)
    canjump2 = livespread1(board, row, col, current_player, dir2, True)
    notjump1 = livespread1(board, row, col, current_player, dir, False)
    notjump2 = livespread1(board, row, col, current_player, dir2, False)
    
    # 初始化答案变量
    ans1, ans2, ans3 = -1, -1, -1
    
    # 计算所有可能的答案
    if canjump1 != -1 and notjump2 != -1:
        ans1 = canjump1 + notjump2 + 1
    if canjump2 != -1 and notjump1 != -1:
        ans2 = canjump2 + notjump1 + 1
    if notjump1 != -1 and notjump2 != -1:
        ans3 = notjump1 + notjump2 + 1
    
    # 返回最大值
    return max(ans1, ans2, ans3)

def deadspread2(board, row, col, current_player, dir):
    dir2 = (dir + 4) % 8  # 计算第二个方向

    # 分别计算八个方向上的死活跳跃和非跳跃传播
    dead_canjump1 = deadspread1(board, row, col, current_player, dir, True)
    dead_canjump2 = deadspread1(board, row, col, current_player, dir2, True)
    dead_notjump1 = deadspread1(board, row, col, current_player, dir, False)
    dead_notjump2 = deadspread1(board, row, col, current_player, dir2, False)
    
    live_canjump1 = livespread1(board, row, col, current_player, dir, True)
    live_canjump2 = livespread1(board, row, col, current_player, dir2, True)
    live_notjump1 = livespread1(board, row, col, current_player, dir, False)
    live_notjump2 = livespread1(board, row, col, current_player, dir2, False)
    
    # 根据条件计算可能的组合传播长度
    combinations = [
        (live_canjump1, dead_notjump2),
        (dead_canjump1, live_notjump2),
        (live_notjump1, dead_canjump2),
        (dead_notjump1, live_canjump2)
    ]
    
    # 找出最大值，如果都为-1则返回-1
    max_spread = -1
    for live_jump, dead_nojump in combinations:
        if live_jump != -1 and dead_nojump != -1:
            max_spread = max(max_spread, live_jump + dead_nojump + 1)
    
    return max_spread

def availover5(board, row, col, current_player, dir):
    row_copy, col_copy = row, col
    count = 0
    dir2 = (dir + 4) % 8  # 计算第二个方向

    # 沿第一个方向检查
    changerowcol(row_copy, col_copy, dir)
    while (not overboard(row_copy, col_copy)) and board[row_copy][col_copy] != 3 - current_player:
        count += 1
        if count >= 5:
            return True
        # 更新位置
        row_copy, col_copy = changerowcol(row_copy, col_copy, dir)
    
    # 重置为初始位置，然后沿第二个方向检查
    row_copy, col_copy = row, col
    changerowcol(row_copy, col_copy, dir2)
    while (not overboard(row_copy, col_copy)) and board[row_copy][col_copy] != 3 - current_player:
        count += 1
        if count >= 5:
            return True
        # 更新位置
        row_copy, col_copy = changerowcol(row_copy, col_copy, dir2)
    
    # 如果没有找到超过5个连续空位或当前玩家的棋子，则返回False
    return False

def live3(board, row, col, current_player, dir):
    # 检查在给定方向上livespread2的值是否为3，并且availover5也返回True
    return livespread2(board, row, col, current_player, dir) == 3 and availover5(board, row, col, current_player, dir)

def doublelive3(board, row, col, current_player):
    num = 0  # 用于计数满足条件的方向数
    # 遍历所有4个方向
    for dir_ in range(4):
        if live3(board, row, col, current_player, dir_):
            num += 1
            if num == 2:
                return True  # 如果有两个方向满足条件，则返回True
    return False  # 如果没有两个方向满足条件，则返回False

def any4(board, row, col, current_player, dir):
    # 计算活棋和死棋的传播
    live = livespread2(board, row, col, current_player, dir)
    dead = deadspread2(board, row, col, current_player, dir)
    # 如果活棋或死棋的传播等于4，则返回True
    return live == 4 or dead == 4

def live4(board, row, col, current_player, dir):
    # 计算第二个方向
    dir2 = (dir + 4) % 8
    # 检查两个方向上的活棋传播加上1是否等于4
    return (livespread1(board, row, col, current_player, dir, False) +
            livespread1(board, row, col, current_player, dir2, False) + 1) == 4

def strict5(board, row, col, current_player, dir):
    # 检查在给定方向上基本传播是否等于5
    return basicspread2(board, row, col, current_player, dir) == 5

def dead5(board, row, col, current_player, dir):
    # 011112
    dir2 = (dir + 4) % 8
    dead1 = deadspread1(board, row, col, current_player, dir, False)
    dead2 = deadspread1(board, row, col, current_player, dir2, False)
    basic1 = basicspread1(board, row, col, current_player, dir)
    basic2 = basicspread1(board, row, col, current_player, dir2)
    
    # 检查死棋的特定模式
    if (basic1 == 0 and dead2 == 4) or (basic2 == 0 and dead1 == 4):
        return True
    if (basic1 > 0 and basic2 > 0 and basic1 + basic2 == 4):
        return True
    return False

def lost5(board, row, col, current_player, dir):
    # 011110
    dir2 = (dir + 4) % 8
    live1 = livespread1(board, row, col, current_player, dir, False)
    live2 = livespread1(board, row, col, current_player, dir2, False)
    basic1 = basicspread1(board, row, col, current_player, dir)
    basic2 = basicspread1(board, row, col, current_player, dir2)
    
    # 检查活棋的特定模式
    if (basic1 == 0 and live2 == 4) or (basic2 == 0 and live1 == 4):
        return True
    return False

def longconnect_dir(board, row, col, current_player, dir):
    # 检查在给定方向的基本传播是否大于5
    return basicspread2(board, row, col, current_player, dir) > 5

def longconnect(board, row, col, current_player):
    # 遍历所有4个方向，检查是否有方向的基本传播大于5
    for dir_ in range(4):
        if longconnect_dir(board, row, col, current_player, dir_):
            return True
    return False

def double4_inline(board, row, col, current_player, dir):
    # 计算第二个方向
    dir2 = (dir + 4) % 8
    # 分别计算两个方向上可以跳过一个死子的活棋传播
    canjump1 = livespread1(board, row, col, current_player, dir, True)
    canjump2 = livespread1(board, row, col, current_player, dir2, True)
    # 分别计算两个方向上不能跳过死子的活棋传播
    notjump1 = livespread1(board, row, col, current_player, dir, False)
    notjump2 = livespread1(board, row, col, current_player, dir2, False)
    
    # 检查是否满足双四的条件
    if (canjump1 != notjump1 and canjump2 != notjump2 and
            canjump1 + notjump2 + 1 == 4 and
            canjump2 + notjump1 + 1 == 4):
        return True
    return False

def double4(board, row, col, current_player):
    num = 0
    # 遍历所有4个方向
    for dir_ in range(4):
        # 如果在某个方向上存在任意4个连续棋子
        if any4(board, row, col, current_player, dir_):
            num += 1
            # 如果已经有两个方向满足条件，或者当前方向满足双四条件
            if num == 2 or double4_inline(board, row, col, current_player, dir_):
                return True
    return False

def banned(board, row, col, current_player):
    # 检查在所有方向上是否有strict5
    for dir_ in range(4):
        if strict5(board, row, col, current_player, dir_):
            return False
    # 检查是否存在双活3、双四或长连
    if (doublelive3(board, row, col, current_player) or
            double4(board, row, col, current_player) or
            longconnect(board, row, col, current_player)):
        return True
    return False

def basicscore(board, row, col, current_player):
    result = 1
    # Current player variables
    cur = current_player
    cur4 = 0
    curlive3 = 0

    curstrict5 = False
    curlongconnect = False

    curlive4 = False
    curdouble4 = False
    cur4live3 = False
    curdoublelive3 = False

    curnow4 = False

    # Opponent variables
    opp = 3 - cur
    opp4 = 0
    opplive3 = 0

    oppdead5 = False
    opplost5 = False
    opplongconnect = False

    opplive4 = False
    oppdouble4 = False
    opp4live3 = False
    oppdoublelive3 = False

    oppnow4 = False

    for dir_ in range(4):
        # Check single-line shape for current player
        if strict5(board, row, col, cur, dir_):
            curstrict5 = True
            break
        # Check single-line shape for opponent
        if dead5(board, row, col, opp, dir_):
            oppdead5 = True
            break
        if lost5(board, row, col, opp, dir_):
            opplost5 = True
            break
        if ((not curlive4) and live4(board,row,col,cur,dir_)):
            curlive4=True
        if ((not opplive4) and live4(board,row,col,opp,dir_)):
            opplive4=True
        if ((not curlongconnect) and longconnect_dir(board,row,col,cur,dir_)):
            curlongconnect=True
        if ((not opplongconnect) and longconnect_dir(board,row,col,opp,dir_)):
            opplongconnect=True
        # Check two-dir shape
        # Check current player
        if any4(board, row, col, cur, dir_):
            if (not curdouble4) and (cur4 or double4_inline(board, row, col, cur, dir_)):
                curdouble4 = True
            if curlive3:
                cur4live3 = True
            cur4 += 1
            curnow4 = True
            result += 500
        else:
            curnow4 = False
        if live3(board, row, col, cur, dir_):
            if curlive3 or (curnow4 and cur4 > 1) or ((not curnow4) and cur4 > 0):
                curdoublelive3 = True
            curlive3 += 1
            result += 500

        # Check opponent
        if any4(board, row, col, opp, dir_):
            if (not oppdouble4) and (opp4 or double4_inline(board, row, col, opp, dir_)):
                oppdouble4 = True
            if opplive3:
                opp4live3 = True
            opp4 += 1
            oppnow4 = True
            result += 450
        else:
            oppnow4 = False
        if live3(board, row, col, opp, dir_):
            if opplive3 or (oppnow4 and opp4 > 1) or ((not oppnow4) and opp4 > 0):
                oppdoublelive3 = True
            opplive3 += 1
            result += 450

        # Calculate scores based on spread
        result += pow(2, (livespread2(board, row, col, cur, dir_) + 2) + 1)
        result += pow(2, (livespread2(board, row, col, opp, dir_) + 1) + 1)
        result += pow(2, deadspread2(board, row, col, cur, dir_) + 2)
        result += pow(2, deadspread2(board, row, col, opp, dir_) + 1)

    # Final score adjustments based on current player
    if cur == 1:
        if curstrict5:
            return 9999
        if opplost5 or curlongconnect or curdouble4 or curdoublelive3:
            return -9999
        if oppdead5:
            return 8888
        if cur4live3 or curlive4:
            return 7777
        if opplive4 or oppdouble4 or opp4live3 or oppdoublelive3:
            return 6666
    else:
        if curstrict5 or curlongconnect:
            return 9999
        if opplost5:
            return -9999
        if oppdead5:
            return 8888
        if curlive4 or curdouble4 or cur4live3:
            return 7777
        if opplive4 or opp4live3:
            return 6666
    return result

def minimax(board, row, col, current_player, depth, positive):
    result=None
    basic_score=None
    
    if positive:
        result = 1000000
        basic_score = basicscore(board, row, col, current_player)

    else:
        result = -1000000
        basic_score = -basicscore(board, row, col, current_player)

    

    if depth == 0 or abs(basic_score) > 7000:
        return basic_score

    # 需要在函数中定义next_score变量
    next_score = None

    # 假设board是可变的，因此不需要先保存再恢复原始状态
    board[row][col] = current_player
    # 进行minimax搜索
    for i in range(19):
        for j in range(19):
            if board[i][j] == 0:
                # 递归调用minimax
                next_score = minimax(board, i, j, 3 - current_player, depth - 1, not positive)
                # 更新result
                if positive:
                    result = min(result, next_score)
                else:
                    result = max(result, next_score)
    
    board[row][col] = 0  # 恢复原始状态，如果board是可变的则不需要这行
    return result + basic_score


def AI(board, current_player, depth):
    best_row = -1
    best_col = -1
    max_score = -10000
    score = None
    
    score_list=[[0 for _ in range(19)] for _ in range(19)]

    for row in range(19):
        for col in range(19):
            if board[row][col] == 0:
                score = minimax(board, row, col, current_player, depth, True)
                score_list[row][col]=score
                if score > max_score:
                    best_row = row
                    best_col = col
                    max_score = score
            else:
                score_list[row][col]=None

    # 返回最佳落子位置
    #print(score_list)
    return best_row, best_col

def helpAI(board,current_player):
    for i in (8,10):
        for j in (8,10):
            if board[i][j]==0:
                return i,j