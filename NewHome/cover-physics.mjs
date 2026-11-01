// Coordinates and velocities use container widths and seconds.
export function stepCovers(bodies, height, dt, time) {
    const size = .32;
    const inset = .025;
    const restitution = .86;
    const clampWalls = body => {
        for (const [axis, velocity, limit] of [['x', 'vx', 1], ['y', 'vy', height]]) {
            const max = limit - inset - size;
            if (body[axis] < inset) {
                body[axis] = inset;
                body[velocity] = Math.abs(body[velocity]) * restitution;
            } else if (body[axis] > max) {
                body[axis] = max;
                body[velocity] = -Math.abs(body[velocity]) * restitution;
            }
        }
    };
    bodies.forEach((body, i) => {
        body.angle ??= 0;
        body.spin ??= 0;
        if (body.held) return;
        body.spin *= Math.exp(-.12 * dt);
        body.spin += Math.sin(time * .31 + i * 2) * .08 * dt;
        body.angle = (body.angle + body.spin * dt) % (Math.PI * 2);
        // A slowly changing current supplies energy against linear drag.
        body.vx += Math.cos(time * .43 + i * 2.3) * .055 * dt;
        body.vy += Math.sin(time * .37 + i * 1.9) * .055 * dt;
        const drag = Math.exp(-.22 * dt);
        body.vx *= drag;
        body.vy *= drag;
        body.x += body.vx * dt;
        body.y += body.vy * dt;
        clampWalls(body);
    });
    // Iteration resolves simultaneous contacts, including contacts against a wall.
    for (let pass = 0; pass < 6; pass++) {
        for (let i = 0; i < bodies.length; i++) {
            for (let j = i + 1; j < bodies.length; j++) {
                const a = bodies[i], b = bodies[j];
                const dx = b.x - a.x, dy = b.y - a.y;
                const distance = Math.hypot(dx, dy);
                if (distance >= size) continue;
                const nx = distance > 1e-8 ? dx / distance : 1;
                const ny = distance > 1e-8 ? dy / distance : 0;
                const invA = a.held ? 0 : 1, invB = b.held ? 0 : 1;
                const mass = invA + invB;
                if (!mass) continue;
                const correction = (size - distance + .00001) / mass;
                a.x -= nx * correction * invA;
                a.y -= ny * correction * invA;
                b.x += nx * correction * invB;
                b.y += ny * correction * invB;
                const closing = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
                if (closing < 0) {
                    const impulse = -(1 + restitution) * closing / mass;
                    a.vx -= impulse * nx * invA;
                    a.vy -= impulse * ny * invA;
                    b.vx += impulse * nx * invB;
                    b.vy += impulse * ny * invB;
                    // Contact friction exchanges sliding motion and angular momentum.
                    const radius = size / 2;
                    const tx = -ny, ty = nx;
                    const slip = (b.vx-a.vx)*tx + (b.vy-a.vy)*ty - radius*(a.spin+b.spin);
                    const friction = Math.max(-impulse*.18, Math.min(impulse*.18, -slip/(3*mass)));
                    a.vx -= friction*tx*invA;
                    a.vy -= friction*ty*invA;
                    b.vx += friction*tx*invB;
                    b.vy += friction*ty*invB;
                    a.spin -= 2*friction/radius*invA;
                    b.spin -= 2*friction/radius*invB;
                }
            }
        }
        bodies.forEach(clampWalls);
    }
}
