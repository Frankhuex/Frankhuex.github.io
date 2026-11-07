import { chooseMove } from './rules.mjs';

self.onmessage = ({ data: { board, player, depth } }) => {
    let lastProgress = 0;
    const point = chooseMove(board, player, depth, (completed, total) => {
        const progress = Math.floor(completed * 100 / total);
        if (progress !== lastProgress) {
            self.postMessage({ progress });
            lastProgress = progress;
        }
    });
    self.postMessage({ point });
};
