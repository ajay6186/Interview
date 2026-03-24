# ============================================================
# Examples 6.4 — Reinforcement Learning (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

import numpy as np

np.random.seed(42)

GRID_SIZE = 10
N_ACTIONS = 4        # 0=up 1=down 2=left 3=right
GOAL      = (9, 9)
GAMMA     = 0.99

def _step(state, action):
    r, c = state
    if   action == 0: r = max(0, r - 1)
    elif action == 1: r = min(GRID_SIZE - 1, r + 1)
    elif action == 2: c = max(0, c - 1)
    else:             c = min(GRID_SIZE - 1, c + 1)
    done   = (r, c) == GOAL
    reward = 10.0 if done else -1.0
    return (r, c), reward, done

# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """Define a grid world environment"""
    state  = (0, 0)
    action = 1  # down
    next_s, reward, done = _step(state, action)
    print("Ex01 — state (0,0) action=down → next:", next_s,
          "reward:", reward, "done:", done)

def ex02():
    """Explore the goal state"""
    state  = (9, 8)
    action = 3  # right
    next_s, reward, done = _step(state, action)
    print("Ex02 — state (9,8) action=right → next:", next_s,
          "reward:", reward, "done:", done)

def ex03():
    """Epsilon-greedy action selection"""
    np.random.seed(42)
    Q  = np.zeros((GRID_SIZE, GRID_SIZE, N_ACTIONS))
    eps = 0.1
    state = (3, 4)
    if np.random.rand() < eps:
        action = np.random.randint(N_ACTIONS)
        kind   = "explore"
    else:
        action = int(np.argmax(Q[state[0], state[1]]))
        kind   = "exploit"
    print("Ex03 — action:", action, "| type:", kind)

def ex04():
    """Initialize Q-table"""
    Q = np.zeros((GRID_SIZE, GRID_SIZE, N_ACTIONS))
    print("Ex04 — Q-table shape:", Q.shape,
          "| total params:", Q.size)

def ex05():
    """Single Q-learning update"""
    Q = np.zeros((GRID_SIZE, GRID_SIZE, N_ACTIONS))
    state = (0, 0); action = 1; reward = -1.0; next_s = (1, 0); done = False
    lr = 0.1
    td_target = reward + GAMMA * np.max(Q[next_s[0], next_s[1]])
    td_error  = td_target - Q[state[0], state[1], action]
    Q[state[0], state[1], action] += lr * td_error
    print("Ex05 — Q[(0,0),1] after update:", round(Q[0, 0, 1], 6))

def ex06():
    """One episode of Q-learning"""
    Q = np.zeros((GRID_SIZE, GRID_SIZE, N_ACTIONS))
    state = (0, 0); total_r = 0.0; steps = 0
    for _ in range(200):
        if np.random.rand() < 0.1:
            action = np.random.randint(N_ACTIONS)
        else:
            action = int(np.argmax(Q[state[0], state[1]]))
        next_s, reward, done = _step(state, action)
        td_target = reward if done else reward + GAMMA * np.max(Q[next_s[0], next_s[1]])
        Q[state[0], state[1], action] += 0.1 * (td_target - Q[state[0], state[1], action])
        state = next_s; total_r += reward; steps += 1
        if done:
            break
    print("Ex06 — episode reward:", round(total_r, 2), "| steps:", steps)

def ex07():
    """Multi-armed bandit: 5 arms"""
    true_means = np.array([0.1, 0.5, 0.3, 0.8, 0.2])
    Q_est = np.zeros(5); N = np.zeros(5)
    total_r = 0.0
    for _ in range(200):
        arm = np.random.randint(5) if np.random.rand() < 0.1 else int(np.argmax(Q_est))
        r = true_means[arm] + np.random.randn() * 0.1
        N[arm] += 1
        Q_est[arm] += (r - Q_est[arm]) / N[arm]
        total_r += r
    print("Ex07 — best arm:", int(np.argmax(Q_est)), "| total reward:", round(total_r, 2))

def ex08():
    """UCB1 bandit: optimism in the face of uncertainty"""
    true_means = np.array([0.1, 0.5, 0.3, 0.8, 0.2])
    k = len(true_means)
    Q_est = np.zeros(k); N = np.ones(k)
    for arm in range(k):
        Q_est[arm] = true_means[arm] + np.random.randn() * 0.1
    total_r = float(Q_est.sum())
    for t in range(k + 1, 501):
        ucb = Q_est + np.sqrt(2 * np.log(t) / (N + 1e-10))
        arm = int(np.argmax(ucb))
        r = true_means[arm] + np.random.randn() * 0.1
        N[arm] += 1
        Q_est[arm] += (r - Q_est[arm]) / N[arm]
        total_r += r
    print("Ex08 — UCB1 best arm:", int(np.argmax(Q_est)), "| total reward:", round(total_r, 2))

def ex09():
    """Bellman equation (text)"""
    print("Ex09 — Bellman Optimality Equation:")
    print("  V*(s) = max_a  [R(s,a) + gamma * V*(next_state(s,a))]")
    print("  Q*(s,a) = R(s,a) + gamma * max_{a'} Q*(next_state(s,a), a')")
    print("  Intuition: optimal value = best immediate reward + discounted future value")

def ex10():
    """Reward shaping: potential-based"""
    def phi(state):
        # Negative Manhattan distance to goal
        return -float(abs(state[0] - GOAL[0]) + abs(state[1] - GOAL[1]))
    state = (3, 4); next_s = (3, 5)
    bonus = GAMMA * phi(next_s) - phi(state)
    print("Ex10 — shaping bonus (3,4)→(3,5):", round(bonus, 4))

def ex11():
    """Discount factor effect on returns"""
    rewards = [-1.0] * 9 + [10.0]  # 9 steps then goal
    for gamma in [0.5, 0.9, 0.99]:
        G = sum(gamma**t * r for t, r in enumerate(rewards))
        print(f"Ex11 — gamma={gamma}: return G={round(G, 4)}")

def ex12():
    """SARSA update (on-policy)"""
    Q = np.zeros((GRID_SIZE, GRID_SIZE, N_ACTIONS))
    state = (0, 0); action = 1; reward = -1.0; next_s = (1, 0); next_a = 2; done = False
    lr = 0.1
    td_target = reward if done else reward + GAMMA * Q[next_s[0], next_s[1], next_a]
    td_error  = td_target - Q[state[0], state[1], action]
    Q[state[0], state[1], action] += lr * td_error
    print("Ex12 — SARSA Q[(0,0),1]:", round(Q[0, 0, 1], 6))

def ex13():
    """Policy evaluation: uniform random policy"""
    policy = np.full((GRID_SIZE, GRID_SIZE, N_ACTIONS), 0.25)
    V = np.zeros((GRID_SIZE, GRID_SIZE))
    for _ in range(50):  # partial convergence
        for r in range(GRID_SIZE):
            for c in range(GRID_SIZE):
                if (r, c) == GOAL:
                    continue
                v = 0.0
                for a in range(N_ACTIONS):
                    ns, rew, done = _step((r, c), a)
                    v += 0.25 * (rew + GAMMA * (0.0 if done else V[ns[0], ns[1]]))
                V[r, c] = v
    print("Ex13 — V[0,0] (50 iters):", round(float(V[0, 0]), 4),
          "| V[9,8]:", round(float(V[9, 8]), 4))

# ─── INTERMEDIATE (14–26) ───────────────────────────────────

def ex14():
    """Full Q-learning training loop"""
    Q = np.zeros((GRID_SIZE, GRID_SIZE, N_ACTIONS))
    episode_rewards = []
    for ep in range(300):
        state = (0, 0); total_r = 0.0
        for _ in range(200):
            action = np.random.randint(N_ACTIONS) if np.random.rand() < 0.1 else int(np.argmax(Q[state[0], state[1]]))
            ns, reward, done = _step(state, action)
            td = reward if done else reward + GAMMA * np.max(Q[ns[0], ns[1]])
            Q[state[0], state[1], action] += 0.1 * (td - Q[state[0], state[1], action])
            state = ns; total_r += reward
            if done:
                break
        episode_rewards.append(total_r)
    print("Ex14 — Q-learning: last 5 rewards:", [round(r, 2) for r in episode_rewards[-5:]],
          "| best action (0,0):", ["up","down","left","right"][int(np.argmax(Q[0,0]))])

def ex15():
    """Value iteration"""
    V = np.zeros((GRID_SIZE, GRID_SIZE))
    for _ in range(500):
        delta = 0.0
        for r in range(GRID_SIZE):
            for c in range(GRID_SIZE):
                if (r, c) == GOAL:
                    continue
                q_vals = []
                for a in range(N_ACTIONS):
                    ns, rew, done = _step((r, c), a)
                    q_vals.append(rew + GAMMA * (0.0 if done else V[ns[0], ns[1]]))
                v_new  = max(q_vals)
                delta  = max(delta, abs(V[r, c] - v_new))
                V[r, c] = v_new
        if delta < 1e-4:
            break
    print("Ex15 — value iteration V[0,0]:", round(float(V[0, 0]), 4),
          "| V[9,8]:", round(float(V[9, 8]), 4))

def ex16():
    """Policy improvement from value function"""
    V = np.zeros((GRID_SIZE, GRID_SIZE))
    # Use 100 iterations for demo
    for _ in range(100):
        for r in range(GRID_SIZE):
            for c in range(GRID_SIZE):
                if (r, c) == GOAL:
                    continue
                q_vals = [_step((r,c),a)[1] + GAMMA*V[_step((r,c),a)[0][0], _step((r,c),a)[0][1]]
                           for a in range(N_ACTIONS)]
                V[r, c] = max(q_vals)
    policy = np.zeros((GRID_SIZE, GRID_SIZE), dtype=int)
    for r in range(GRID_SIZE):
        for c in range(GRID_SIZE):
            if (r, c) == GOAL:
                continue
            q_vals = [_step((r,c),a)[1] + GAMMA*V[_step((r,c),a)[0][0],_step((r,c),a)[0][1]]
                       for a in range(N_ACTIONS)]
            policy[r, c] = int(np.argmax(q_vals))
    action_names = ["up","down","left","right"]
    print("Ex16 — greedy policy at (0,0):", action_names[policy[0,0]],
          "| (5,5):", action_names[policy[5,5]])

def ex17():
    """SARSA full training loop"""
    Q = np.zeros((GRID_SIZE, GRID_SIZE, N_ACTIONS))
    episode_rewards = []
    for ep in range(200):
        state = (0, 0)
        action = np.random.randint(N_ACTIONS) if np.random.rand() < 0.1 else int(np.argmax(Q[state[0], state[1]]))
        total_r = 0.0
        for _ in range(200):
            ns, reward, done = _step(state, action)
            next_a = np.random.randint(N_ACTIONS) if np.random.rand() < 0.1 else int(np.argmax(Q[ns[0], ns[1]]))
            td = reward if done else reward + GAMMA * Q[ns[0], ns[1], next_a]
            Q[state[0], state[1], action] += 0.1 * (td - Q[state[0], state[1], action])
            state = ns; action = next_a; total_r += reward
            if done:
                break
        episode_rewards.append(total_r)
    print("Ex17 — SARSA last 5 rewards:", [round(r, 2) for r in episode_rewards[-5:]])

def ex18():
    """Epsilon decay schedule"""
    eps_start, eps_end, decay = 1.0, 0.05, 0.99
    eps = eps_start
    eps_history = []
    for ep in range(100):
        eps = max(eps_end, eps * decay)
        eps_history.append(round(eps, 4))
    print("Ex18 — epsilon at ep0:", eps_history[0], "| ep10:", eps_history[10],
          "| ep50:", eps_history[50], "| ep99:", eps_history[99])

def ex19():
    """Reward shaping: guided Q-learning"""
    def phi(state):
        return -float(abs(state[0] - GOAL[0]) + abs(state[1] - GOAL[1]))
    Q = np.zeros((GRID_SIZE, GRID_SIZE, N_ACTIONS))
    for ep in range(200):
        state = (0, 0)
        for _ in range(200):
            action = np.random.randint(N_ACTIONS) if np.random.rand() < 0.1 else int(np.argmax(Q[state[0], state[1]]))
            ns, reward, done = _step(state, action)
            shaped = reward + GAMMA * phi(ns) - phi(state)
            td = shaped if done else shaped + GAMMA * np.max(Q[ns[0], ns[1]])
            Q[state[0], state[1], action] += 0.1 * (td - Q[state[0], state[1], action])
            state = ns
            if done:
                break
    print("Ex19 — shaped Q-learning Q[0,0] best action:",
          ["up","down","left","right"][int(np.argmax(Q[0,0]))])

def ex20():
    """Monte Carlo prediction (first-visit)"""
    Q = np.zeros((GRID_SIZE, GRID_SIZE, N_ACTIONS))
    returns = {(r, c, a): [] for r in range(GRID_SIZE) for c in range(GRID_SIZE) for a in range(N_ACTIONS)}
    for _ in range(100):
        episode = []
        state = (0, 0)
        for _ in range(100):
            action = np.random.randint(N_ACTIONS)
            ns, reward, done = _step(state, action)
            episode.append((state, action, reward))
            state = ns
            if done:
                break
        G = 0.0; visited = set()
        for state, action, reward in reversed(episode):
            G = reward + GAMMA * G
            if (state, action) not in visited:
                returns[(state[0], state[1], action)].append(G)
                Q[state[0], state[1], action] = np.mean(returns[(state[0], state[1], action)])
                visited.add((state, action))
    print("Ex20 — MC Q[0,0]:", np.round(Q[0, 0], 4).tolist())

def ex21():
    """n-step TD return"""
    n = 3
    Q = np.zeros((GRID_SIZE, GRID_SIZE, N_ACTIONS))
    state = (0, 0); states = [state]; actions = []; rewards = []
    for _ in range(20):
        action = np.random.randint(N_ACTIONS)
        ns, r, done = _step(state, action)
        actions.append(action); rewards.append(r); states.append(ns)
        state = ns
        if done:
            break
    T = len(rewards)
    for t in range(min(T - n, 5)):
        G = sum(GAMMA**i * rewards[t+i] for i in range(n))
        if t + n < T:
            G += GAMMA**n * np.max(Q[states[t+n][0], states[t+n][1]])
        Q[states[t][0], states[t][1], actions[t]] += 0.1 * (G - Q[states[t][0], states[t][1], actions[t]])
    print("Ex21 — 3-step TD Q update, first 5 Q values at (0,0):", np.round(Q[0,0], 6).tolist())

def ex22():
    """Experience replay buffer"""
    class ReplayBuffer:
        def __init__(self, capacity=1000):
            self.buffer = []
            self.capacity = capacity
        def push(self, transition):
            if len(self.buffer) >= self.capacity:
                self.buffer.pop(0)
            self.buffer.append(transition)
        def sample(self, batch_size):
            idx = np.random.choice(len(self.buffer), size=min(batch_size, len(self.buffer)), replace=False)
            return [self.buffer[i] for i in idx]
        def __len__(self):
            return len(self.buffer)
    buf = ReplayBuffer(capacity=100)
    for _ in range(50):
        buf.push({"state": (0,0), "action": 1, "reward": -1.0, "next": (1,0), "done": False})
    batch = buf.sample(8)
    print("Ex22 — buffer size:", len(buf), "| batch size:", len(batch))

def ex23():
    """Double Q-learning: reduce overestimation"""
    QA = np.zeros((GRID_SIZE, GRID_SIZE, N_ACTIONS))
    QB = np.zeros((GRID_SIZE, GRID_SIZE, N_ACTIONS))
    episode_rewards = []
    for _ in range(200):
        state = (0, 0); total_r = 0.0
        for _ in range(200):
            Q_sum = QA[state[0], state[1]] + QB[state[0], state[1]]
            action = np.random.randint(N_ACTIONS) if np.random.rand() < 0.1 else int(np.argmax(Q_sum))
            ns, reward, done = _step(state, action)
            if np.random.rand() < 0.5:
                best_a = int(np.argmax(QA[ns[0], ns[1]]))
                td = reward + (0.0 if done else GAMMA * QB[ns[0], ns[1], best_a])
                QA[state[0], state[1], action] += 0.1 * (td - QA[state[0], state[1], action])
            else:
                best_a = int(np.argmax(QB[ns[0], ns[1]]))
                td = reward + (0.0 if done else GAMMA * QA[ns[0], ns[1], best_a])
                QB[state[0], state[1], action] += 0.1 * (td - QB[state[0], state[1], action])
            state = ns; total_r += reward
            if done:
                break
        episode_rewards.append(total_r)
    print("Ex23 — double Q-learning last 5 rewards:", [round(r,2) for r in episode_rewards[-5:]])

def ex24():
    """Prioritized experience replay concept"""
    class PrioritizedReplay:
        def __init__(self, capacity=500):
            self.buffer = []
            self.priorities = []
            self.capacity = capacity
        def push(self, transition, priority=1.0):
            if len(self.buffer) >= self.capacity:
                self.buffer.pop(0); self.priorities.pop(0)
            self.buffer.append(transition)
            self.priorities.append(priority)
        def sample(self, batch_size):
            p = np.array(self.priorities)
            p = p / p.sum()
            idx = np.random.choice(len(self.buffer), size=min(batch_size, len(self.buffer)), p=p, replace=False)
            return [self.buffer[i] for i in idx], idx
        def update_priority(self, idx, new_priorities):
            for i, pr in zip(idx, new_priorities):
                self.priorities[i] = pr
    buf = PrioritizedReplay(200)
    for i in range(100):
        buf.push({"state": (i % 10, i % 10)}, priority=float(i + 1))
    batch, indices = buf.sample(8)
    print("Ex24 — PER buffer size:", len(buf.buffer), "| batch:", len(batch))

def ex25():
    """Policy gradient: REINFORCE concept"""
    print("Ex25 — REINFORCE (Williams 1992):")
    print("  1. Run episode with policy pi_theta, collect (s,a,r) trajectory.")
    print("  2. Compute returns G_t = sum_{k>=t} gamma^(k-t) * r_k.")
    print("  3. Update: theta += alpha * G_t * grad_theta log pi_theta(a_t|s_t).")
    print("  Key: gradient pushes up log-prob of actions with high returns.")
    # Simple simulation: softmax policy gradient on 4-action bandit
    rng = np.random.default_rng(0)
    logits = np.zeros(4)
    true_rewards = np.array([0.1, 0.8, 0.3, 0.5])
    alpha = 0.05
    for _ in range(500):
        probs = np.exp(logits) / np.exp(logits).sum()
        action = rng.choice(4, p=probs)
        reward = true_rewards[action] + rng.normal(0, 0.1)
        # Policy gradient update
        grad = -probs.copy()
        grad[action] += 1
        logits += alpha * reward * grad
    print("  Learned policy:", np.round(np.exp(logits)/np.exp(logits).sum(), 4).tolist())

def ex26():
    """DQN key concepts"""
    print("Ex26 — Deep Q-Network (DQN) components:")
    print("  1. Q-network:      neural net Q(s,a;theta) approximates Q*(s,a).")
    print("  2. Experience replay: store (s,a,r,s',done) buffer; random mini-batches.")
    print("  3. Target network: Q(s',a';theta^-) updated every C steps → stable targets.")
    print("  4. Loss: MSE between Q(s,a;theta) and y=r+gamma*max_a' Q(s',a';theta^-).")
    print("  5. epsilon-greedy exploration during training.")

# ─── NESTED (27–38) ────────────────────────────────────────

def ex27():
    """RLAgent class: abstract interface"""
    class RLAgent:
        def __init__(self, n_states_r, n_states_c, n_actions, lr=0.1, gamma=0.99, epsilon=0.1):
            self.Q = np.zeros((n_states_r, n_states_c, n_actions))
            self.lr = lr; self.gamma = gamma; self.epsilon = epsilon
        def select_action(self, state):
            if np.random.rand() < self.epsilon:
                return np.random.randint(self.Q.shape[2])
            return int(np.argmax(self.Q[state[0], state[1]]))
        def update(self, s, a, r, ns, done):
            td = r if done else r + self.gamma * np.max(self.Q[ns[0], ns[1]])
            self.Q[s[0], s[1], a] += self.lr * (td - self.Q[s[0], s[1], a])
        def train(self, n_episodes=300):
            rewards = []
            for _ in range(n_episodes):
                s = (0, 0); G = 0.0
                for _ in range(200):
                    a = self.select_action(s)
                    ns, r, done = _step(s, a)
                    self.update(s, a, r, ns, done)
                    s = ns; G += r
                    if done:
                        break
                rewards.append(G)
            return rewards
    agent = RLAgent(GRID_SIZE, GRID_SIZE, N_ACTIONS)
    rewards = agent.train(300)
    print("Ex27 — RLAgent last 5 rewards:", [round(r,2) for r in rewards[-5:]],
          "| best action (0,0):", ["up","down","left","right"][int(np.argmax(agent.Q[0,0]))])

def ex28():
    """Policy iteration: full PI loop"""
    V = np.zeros((GRID_SIZE, GRID_SIZE))
    policy = np.zeros((GRID_SIZE, GRID_SIZE), dtype=int)
    for iteration in range(10):
        # Policy evaluation
        for _ in range(100):
            for r in range(GRID_SIZE):
                for c in range(GRID_SIZE):
                    if (r, c) == GOAL:
                        continue
                    a = policy[r, c]
                    ns, rew, done = _step((r, c), a)
                    V[r, c] = rew + GAMMA * (0.0 if done else V[ns[0], ns[1]])
        # Policy improvement
        stable = True
        for r in range(GRID_SIZE):
            for c in range(GRID_SIZE):
                if (r, c) == GOAL:
                    continue
                q_vals = [_step((r,c),a)[1] + GAMMA*(0.0 if _step((r,c),a)[2] else V[_step((r,c),a)[0][0],_step((r,c),a)[0][1]])
                           for a in range(N_ACTIONS)]
                new_a = int(np.argmax(q_vals))
                if new_a != policy[r, c]:
                    stable = False
                policy[r, c] = new_a
        if stable:
            print(f"Ex28 — policy iteration converged at iteration {iteration + 1}")
            break
    action_names = ["up","down","left","right"]
    print("       V[0,0]:", round(float(V[0,0]), 4),
          "| optimal action (0,0):", action_names[policy[0,0]])

def ex29():
    """Multi-armed bandit: Thompson Sampling"""
    k = 5
    true_means = np.array([0.1, 0.5, 0.3, 0.8, 0.2])
    alpha_ts = np.ones(k)  # successes + 1
    beta_ts  = np.ones(k)  # failures + 1
    total_r  = 0.0
    rng = np.random.default_rng(42)
    for t in range(500):
        # Sample from Beta distribution (binary rewards)
        samples = rng.beta(alpha_ts, beta_ts)
        arm = int(np.argmax(samples))
        success = rng.random() < true_means[arm]
        r = 1.0 if success else 0.0
        if success:
            alpha_ts[arm] += 1
        else:
            beta_ts[arm] += 1
        total_r += r
    print("Ex29 — Thompson Sampling best arm:", int(np.argmax(alpha_ts / (alpha_ts + beta_ts))),
          "| total reward:", round(total_r, 2))

def ex30():
    """Actor-Critic update"""
    print("Ex30 — Actor-Critic (A2C):")
    print("  Actor: pi_theta(a|s)   — policy network")
    print("  Critic: V_w(s)         — value network")
    print("  TD error: delta = r + gamma*V_w(s') - V_w(s)")
    print("  Actor update:  theta += alpha * delta * grad_theta log pi_theta(a|s)")
    print("  Critic update: w     += beta  * delta * grad_w V_w(s)")
    # Toy simulation
    rng = np.random.default_rng(42)
    actor_logits = np.zeros(N_ACTIONS)
    critic_V     = 0.0
    alpha_a = 0.01; beta_c = 0.1
    state = (5, 5); total_r = 0.0
    for _ in range(500):
        probs  = np.exp(actor_logits) / np.exp(actor_logits).sum()
        action = rng.choice(N_ACTIONS, p=probs)
        ns, reward, done = _step(state, action)
        next_V = 0.0 if done else critic_V  # simplified
        delta  = reward + GAMMA * next_V - critic_V
        # Actor update
        grad = -probs.copy(); grad[action] += 1
        actor_logits += alpha_a * delta * grad
        # Critic update
        critic_V += beta_c * delta
        state = (0, 0) if done else ns; total_r += reward
    print("  Toy A2C total reward:", round(total_r, 2))

def ex31():
    """Proximal Policy Optimization (PPO) concept"""
    print("Ex31 — PPO clip objective:")
    print("  r_t(theta) = pi_theta(a_t|s_t) / pi_theta_old(a_t|s_t)  (probability ratio)")
    print("  L_CLIP = E[ min(r_t * A_t, clip(r_t, 1-eps, 1+eps) * A_t) ]")
    print("  Clipping prevents large policy updates → more stable training.")
    print("  A_t = Generalized Advantage Estimate (GAE) using TD(lambda).")
    print("  PPO-2 dominates benchmark tasks; OpenAI used it for InstructGPT RLHF.")

def ex32():
    """Curiosity-driven exploration: intrinsic reward"""
    class CuriosityModule:
        def __init__(self, state_size=2, hidden=8):
            rng = np.random.default_rng(42)
            self.W = rng.standard_normal((state_size, hidden)) * 0.1
        def encode(self, state):
            s = np.array(list(state), dtype=float) / GRID_SIZE
            return np.tanh(s @ self.W)
        def intrinsic_reward(self, state, next_state):
            diff = self.encode(next_state) - self.encode(state)
            return float(np.sum(diff ** 2))
    curiosity = CuriosityModule()
    Q = np.zeros((GRID_SIZE, GRID_SIZE, N_ACTIONS))
    for _ in range(100):
        state = (0, 0)
        for _ in range(50):
            action = np.random.randint(N_ACTIONS) if np.random.rand() < 0.2 else int(np.argmax(Q[state[0], state[1]]))
            ns, ext_reward, done = _step(state, action)
            intr_reward = curiosity.intrinsic_reward(state, ns)
            total_reward = ext_reward + 0.5 * intr_reward
            td = total_reward if done else total_reward + GAMMA * np.max(Q[ns[0], ns[1]])
            Q[state[0], state[1], action] += 0.1 * (td - Q[state[0], state[1], action])
            state = ns
            if done:
                break
    print("Ex32 — curiosity-driven Q best action at (0,0):",
          ["up","down","left","right"][int(np.argmax(Q[0,0]))])

def ex33():
    """Multi-agent RL: independent Q-learners"""
    # Two agents on the same grid, independent
    Q_agents = [np.zeros((GRID_SIZE, GRID_SIZE, N_ACTIONS)) for _ in range(2)]
    episode_rewards = [[], []]
    for _ in range(100):
        states  = [(0, 0), (9, 0)]
        total_r = [0.0, 0.0]
        for _ in range(200):
            done_all = True
            for i, (Q, state) in enumerate(zip(Q_agents, states)):
                action = np.random.randint(N_ACTIONS) if np.random.rand() < 0.15 else int(np.argmax(Q[state[0], state[1]]))
                ns, r, done = _step(state, action)
                td = r if done else r + GAMMA * np.max(Q[ns[0], ns[1]])
                Q[state[0], state[1], action] += 0.1 * (td - Q[state[0], state[1], action])
                states[i] = ns; total_r[i] += r
                if not done:
                    done_all = False
            if done_all:
                break
        for i in range(2):
            episode_rewards[i].append(total_r[i])
    for i in range(2):
        print(f"Ex33 — agent {i} last 3 rewards:", [round(r, 2) for r in episode_rewards[i][-3:]])

def ex34():
    """Hindsight Experience Replay (HER) concept"""
    print("Ex34 — Hindsight Experience Replay (HER):")
    print("  Motivation: sparse rewards make RL hard (e.g., goal not reached).")
    print("  HER trick: replay episode with achieved state as the goal.")
    print("  If agent wanted (5,5) but reached (3,4): replay with goal=(3,4) → reward=+10.")
    print("  Allows learning from failures; especially powerful for robotics.")
    # Simple simulation
    Q = np.zeros((GRID_SIZE, GRID_SIZE, N_ACTIONS))
    her_rewards = []
    rng = np.random.default_rng(42)
    for _ in range(200):
        state = (0, 0); trajectory = []; total_r = 0.0
        for _ in range(50):
            action = rng.integers(N_ACTIONS) if rng.random() < 0.2 else int(np.argmax(Q[state[0], state[1]]))
            ns, r, done = _step(state, action)
            trajectory.append((state, action, r, ns, done))
            state = ns; total_r += r
            if done:
                break
        # HER: relabel with achieved goal = final state
        final_state = trajectory[-1][3]
        for s, a, r, ns, done in trajectory:
            her_done = (ns == final_state)
            her_r = 10.0 if her_done else -1.0
            td = her_r if her_done else her_r + GAMMA * np.max(Q[ns[0], ns[1]])
            Q[s[0], s[1], a] += 0.1 * (td - Q[s[0], s[1], a])
        her_rewards.append(total_r)
    print("  HER last 5 rewards:", [round(r,2) for r in her_rewards[-5:]])

def ex35():
    """Reward function design: curriculum learning"""
    # Stage 1: goal is nearby
    def goal_near():
        return (5, 5)
    # Stage 2: goal is far (original)
    def goal_far():
        return GOAL
    def _step_custom(state, action, goal):
        r, c = state
        if   action == 0: r = max(0, r - 1)
        elif action == 1: r = min(GRID_SIZE-1, r+1)
        elif action == 2: c = max(0, c-1)
        else:             c = min(GRID_SIZE-1, c+1)
        done = (r, c) == goal
        reward = 10.0 if done else -1.0
        return (r, c), reward, done
    Q = np.zeros((GRID_SIZE, GRID_SIZE, N_ACTIONS))
    for phase, goal in enumerate([goal_near(), goal_far()]):
        for _ in range(100):
            state = (0, 0)
            for _ in range(200):
                action = np.random.randint(N_ACTIONS) if np.random.rand() < 0.15 else int(np.argmax(Q[state[0], state[1]]))
                ns, r, done = _step_custom(state, action, goal)
                td = r if done else r + GAMMA * np.max(Q[ns[0], ns[1]])
                Q[state[0], state[1], action] += 0.1 * (td - Q[state[0], state[1], action])
                state = ns
                if done:
                    break
    print("Ex35 — curriculum Q best action at (0,0):",
          ["up","down","left","right"][int(np.argmax(Q[0,0]))])

def ex36():
    """DQN with experience replay (simplified, no neural network)"""
    class SimpleDQN:
        def __init__(self):
            self.Q        = np.zeros((GRID_SIZE, GRID_SIZE, N_ACTIONS))
            self.Q_target = np.zeros((GRID_SIZE, GRID_SIZE, N_ACTIONS))
            self.buffer   = []
            self.update_freq = 20
            self.step_count  = 0
        def push(self, transition):
            if len(self.buffer) > 500:
                self.buffer.pop(0)
            self.buffer.append(transition)
        def sample(self, n=16):
            idx = np.random.choice(len(self.buffer), size=min(n, len(self.buffer)), replace=False)
            return [self.buffer[i] for i in idx]
        def train_step(self):
            if len(self.buffer) < 32:
                return
            batch = self.sample(16)
            for s, a, r, ns, done in batch:
                td = r if done else r + GAMMA * np.max(self.Q_target[ns[0], ns[1]])
                self.Q[s[0], s[1], a] += 0.1 * (td - self.Q[s[0], s[1], a])
            self.step_count += 1
            if self.step_count % self.update_freq == 0:
                self.Q_target = self.Q.copy()
    dqn = SimpleDQN(); episode_rewards = []
    for _ in range(300):
        state = (0,0); total_r = 0.0
        for _ in range(200):
            action = np.random.randint(N_ACTIONS) if np.random.rand() < 0.1 else int(np.argmax(dqn.Q[state[0], state[1]]))
            ns, r, done = _step(state, action)
            dqn.push((state, action, r, ns, done))
            dqn.train_step()
            state = ns; total_r += r
            if done:
                break
        episode_rewards.append(total_r)
    print("Ex36 — DQN-style last 5 rewards:", [round(r,2) for r in episode_rewards[-5:]])

def ex37():
    """Safe RL: constraint-based reward"""
    def _step_safe(state, action, forbidden={(3,3),(3,4),(4,3),(4,4)}):
        r, c = state
        if   action == 0: r = max(0, r-1)
        elif action == 1: r = min(GRID_SIZE-1, r+1)
        elif action == 2: c = max(0, c-1)
        else:             c = min(GRID_SIZE-1, c+1)
        done    = (r, c) == GOAL
        reward  = 10.0 if done else (-5.0 if (r, c) in forbidden else -1.0)
        return (r, c), reward, done
    Q = np.zeros((GRID_SIZE, GRID_SIZE, N_ACTIONS))
    for _ in range(200):
        state = (0, 0)
        for _ in range(200):
            action = np.random.randint(N_ACTIONS) if np.random.rand() < 0.15 else int(np.argmax(Q[state[0], state[1]]))
            ns, r, done = _step_safe(state, action)
            td = r if done else r + GAMMA * np.max(Q[ns[0], ns[1]])
            Q[state[0], state[1], action] += 0.1 * (td - Q[state[0], state[1], action])
            state = ns
            if done:
                break
    print("Ex37 — safe RL Q[3,3] (forbidden):", np.round(Q[3,3], 4).tolist())
    print("       best action at (0,0):", ["up","down","left","right"][int(np.argmax(Q[0,0]))])

def ex38():
    """Offline RL concept (batch RL)"""
    print("Ex38 — Offline RL (Batch RL):")
    print("  Standard RL: agent interacts with environment to collect data.")
    print("  Offline RL:  agent learns only from a fixed dataset (no new interactions).")
    print("  Challenges:")
    print("    - Distribution shift: learned policy differs from data-collection policy.")
    print("    - Extrapolation error: Q-values overestimated for out-of-distribution actions.")
    print("  Key algorithms:")
    print("    - BCQ (Batch-Constrained Q-Learning): restrict actions to data distribution.")
    print("    - CQL (Conservative Q-Learning): penalise Q-values for OOD actions.")
    print("    - IQL (Implicit Q-Learning): avoid explicit OOD evaluation.")
    print("  Applications: autonomous driving, healthcare, recommendation from logs.")

# ─── ADVANCED (39–50) ───────────────────────────────────────

def ex39():
    """Q-learning vs SARSA: cliff walking comparison"""
    def _step_cliff(state, action, cliff_cells={(r, c) for r in range(1, 10) for c in [7]}):
        r, c = state
        if   action == 0: r = max(0, r-1)
        elif action == 1: r = min(GRID_SIZE-1, r+1)
        elif action == 2: c = max(0, c-1)
        else:             c = min(GRID_SIZE-1, c+1)
        if (r, c) in cliff_cells:
            return (0, 0), -100.0, False
        done = (r, c) == GOAL
        return (r, c), 10.0 if done else -1.0, done
    def train(use_sarsa=False):
        Q = np.zeros((GRID_SIZE, GRID_SIZE, N_ACTIONS))
        rewards = []
        for _ in range(300):
            s = (0, 0); total_r = 0.0
            a = np.random.randint(N_ACTIONS) if np.random.rand() < 0.1 else int(np.argmax(Q[s[0],s[1]]))
            for _ in range(200):
                ns, r, done = _step_cliff(s, a)
                na = np.random.randint(N_ACTIONS) if np.random.rand() < 0.1 else int(np.argmax(Q[ns[0],ns[1]]))
                if use_sarsa:
                    td = r if done else r + GAMMA * Q[ns[0], ns[1], na]
                else:
                    td = r if done else r + GAMMA * np.max(Q[ns[0], ns[1]])
                Q[s[0],s[1],a] += 0.1*(td - Q[s[0],s[1],a]); s=ns; a=na; total_r+=r
                if done: break
            rewards.append(total_r)
        return rewards
    ql_r  = train(use_sarsa=False)
    sar_r = train(use_sarsa=True)
    print("Ex39 — Q-learning last 5:", [round(r,2) for r in ql_r[-5:]])
    print("       SARSA last 5:     ", [round(r,2) for r in sar_r[-5:]])

def ex40():
    """Learned Q-function analysis: visualise value map"""
    Q, rewards = np.zeros((GRID_SIZE, GRID_SIZE, N_ACTIONS)), []
    for _ in range(500):
        s=(0,0); G=0.0
        for _ in range(200):
            a = np.random.randint(N_ACTIONS) if np.random.rand()<0.1 else int(np.argmax(Q[s[0],s[1]]))
            ns,r,done = _step(s,a)
            td = r if done else r+GAMMA*np.max(Q[ns[0],ns[1]])
            Q[s[0],s[1],a]+=0.1*(td-Q[s[0],s[1],a]); s=ns; G+=r
            if done: break
        rewards.append(G)
    V = Q.max(axis=2)
    print("Ex40 — V-function diagonal (0,0)→(9,9):", [round(float(V[i,i]),2) for i in range(0,10,2)])

def ex41():
    """RL for continuous actions: DDPG concept"""
    print("Ex41 — DDPG (Deep Deterministic Policy Gradient):")
    print("  Problem: continuous action spaces (e.g., robot joint torques).")
    print("  Actor:   mu_theta(s) → deterministic action a = mu(s).")
    print("  Critic:  Q_w(s, a)   → value of action a in state s.")
    print("  Update:")
    print("    Critic: minimize MSE(Q_w(s,a), r+gamma*Q_w'(s',mu_theta'(s')))")
    print("    Actor:  maximize E[Q_w(s, mu_theta(s))] via policy gradient.")
    print("  Tricks: target networks, replay buffer, Ornstein-Uhlenbeck noise.")
    print("  Successor: TD3 (twin critics, delayed policy update, target noise).")

def ex42():
    """Distributional RL: C51 concept"""
    print("Ex42 — C51 (Categorical DQN, Bellemare 2017):")
    print("  Instead of predicting E[G], predict the full return distribution.")
    print("  Represent Z(s,a) as a categorical distribution over N atoms {z1,...,zN}.")
    print("  Range: [V_min, V_max] split into N=51 atoms.")
    print("  Loss: KL divergence between Bellman-projected target and predicted distribution.")
    print("  Benefits: better sample efficiency, more robust to rewards of varying scale.")
    print("  Successors: QR-DQN (quantile regression), IQN (implicit quantile networks).")

def ex43():
    """Model-based RL: Dyna-Q"""
    Q = np.zeros((GRID_SIZE, GRID_SIZE, N_ACTIONS))
    model = {}  # (state, action) → (next_state, reward)
    n_planning = 5
    episode_rewards = []
    for _ in range(200):
        state = (0, 0); total_r = 0.0
        for _ in range(200):
            action = np.random.randint(N_ACTIONS) if np.random.rand() < 0.15 else int(np.argmax(Q[state[0], state[1]]))
            ns, r, done = _step(state, action)
            # Real experience update
            td = r if done else r + GAMMA * np.max(Q[ns[0], ns[1]])
            Q[state[0], state[1], action] += 0.1 * (td - Q[state[0], state[1], action])
            model[(state, action)] = (ns, r, done)
            # Planning updates
            if model:
                keys = list(model.keys())
                for _ in range(n_planning):
                    s_p, a_p = keys[np.random.randint(len(keys))]
                    ns_p, r_p, d_p = model[(s_p, a_p)]
                    td_p = r_p if d_p else r_p + GAMMA * np.max(Q[ns_p[0], ns_p[1]])
                    Q[s_p[0], s_p[1], a_p] += 0.1 * (td_p - Q[s_p[0], s_p[1], a_p])
            state = ns; total_r += r
            if done:
                break
        episode_rewards.append(total_r)
    print("Ex43 — Dyna-Q last 5 rewards:", [round(r,2) for r in episode_rewards[-5:]])

def ex44():
    """RL convergence analysis: running average reward"""
    Q, window = np.zeros((GRID_SIZE, GRID_SIZE, N_ACTIONS)), 20
    all_rewards = []
    for _ in range(300):
        s=(0,0); G=0.0
        for _ in range(200):
            a = np.random.randint(N_ACTIONS) if np.random.rand()<0.1 else int(np.argmax(Q[s[0],s[1]]))
            ns,r,done=_step(s,a)
            td = r if done else r+GAMMA*np.max(Q[ns[0],ns[1]])
            Q[s[0],s[1],a]+=0.1*(td-Q[s[0],s[1],a]); s=ns; G+=r
            if done: break
        all_rewards.append(G)
    running_avg = [np.mean(all_rewards[max(0,i-window):i+1]) for i in range(len(all_rewards))]
    print("Ex44 — running avg at ep50:", round(running_avg[49], 2),
          "| ep150:", round(running_avg[149], 2),
          "| ep299:", round(running_avg[299], 2))

def ex45():
    """Reward hacking detection"""
    print("Ex45 — Reward Hacking & Goodhart's Law:")
    print("  When a measure becomes a target, it ceases to be a good measure.")
    print("  Examples:")
    print("    - Boat race game: agent circles fire instead of finishing the race.")
    print("    - Grasping robot: moves camera rather than moving object.")
    print("    - ChatGPT-style RLHF: sycophantic long answers score high on human approval.")
    print("  Mitigations:")
    print("    - Reward modelling with diverse evaluators.")
    print("    - Constrained RL: explicitly forbid loopholes.")
    print("    - Process-based supervision: reward reasoning, not just outcomes.")
    print("    - Red-teaming: adversarially find reward misspecifications.")

def ex46():
    """Hierarchical RL: options framework concept"""
    print("Ex46 — Options Framework (Sutton, Precup, Singh 1999):")
    print("  Option = (I, pi, beta): initiation set, intra-option policy, termination condition.")
    print("  Example: 'navigate to room A' is a high-level option.")
    print("  Temporal abstraction: high-level policy selects options (macro-actions).")
    print("  Benefits: faster learning, reusable skills, interpretable behaviour.")
    # Simulate: two sub-goals on the way to GOAL
    SUBGOAL1 = (3, 9)
    SUBGOAL2 = (9, 3)
    def goal_reward(state, goal):
        return 5.0 if state == goal else -1.0
    Q = np.zeros((GRID_SIZE, GRID_SIZE, N_ACTIONS))
    for ep in range(200):
        s = (0, 0); current_goal = SUBGOAL1
        for _ in range(200):
            a = np.random.randint(N_ACTIONS) if np.random.rand() < 0.2 else int(np.argmax(Q[s[0],s[1]]))
            ns, _, done_env = _step(s, a)
            r = goal_reward(ns, current_goal)
            if ns == SUBGOAL1: current_goal = SUBGOAL2
            if ns == SUBGOAL2: current_goal = GOAL
            done = (ns == GOAL)
            td = r if done else r + GAMMA * np.max(Q[ns[0], ns[1]])
            Q[s[0],s[1],a] += 0.1*(td - Q[s[0],s[1],a])
            s = ns
            if done: break
    print("  Hierarchical Q best action at (0,0):", ["up","down","left","right"][int(np.argmax(Q[0,0]))])

def ex47():
    """Sample complexity analysis: Q-learning convergence"""
    results = {}
    for eps in [0.05, 0.1, 0.2, 0.5]:
        Q = np.zeros((GRID_SIZE, GRID_SIZE, N_ACTIONS))
        first_solve = None
        for ep in range(500):
            s=(0,0); total_r=0.0
            for _ in range(200):
                a = np.random.randint(N_ACTIONS) if np.random.rand()<eps else int(np.argmax(Q[s[0],s[1]]))
                ns,r,done=_step(s,a)
                td = r if done else r+GAMMA*np.max(Q[ns[0],ns[1]])
                Q[s[0],s[1],a]+=0.1*(td-Q[s[0],s[1],a]); s=ns; total_r+=r
                if done: break
            if total_r > 0 and first_solve is None:
                first_solve = ep + 1
        results[eps] = first_solve
    print("Ex47 — eps → first solve episode:", results)

def ex48():
    """RLHF concept: Reinforcement Learning from Human Feedback"""
    print("Ex48 — RLHF pipeline (InstructGPT / ChatGPT):")
    print("  Step 1: SFT — Supervised Fine-Tuning on curated demonstrations.")
    print("  Step 2: RM  — Reward Model trained on human preference comparisons.")
    print("           Input: (prompt, response_A, response_B) → which is better?")
    print("           Output: scalar reward r(prompt, response).")
    print("  Step 3: PPO — Fine-tune SFT model to maximise RM reward.")
    print("           KL penalty: prevent policy from deviating too far from SFT.")
    print("  Objective: maximize E[r(x,y)] - beta * KL(pi_RL || pi_SFT)")
    print("  Extensions: DPO (Direct Preference Optimisation) avoids explicit RM.")

def ex49():
    """Meta-RL: MAML concept"""
    print("Ex49 — Model-Agnostic Meta-Learning (MAML, Finn 2017):")
    print("  Goal: learn an initial parameter theta* such that a few gradient steps")
    print("  on a new task yield good performance (fast adaptation).")
    print("  Meta-training loop:")
    print("    for each task T_i:")
    print("      1. Sample K episodes from T_i.")
    print("      2. Compute adapted parameters: theta_i' = theta - alpha * grad_theta L_Ti(theta)")
    print("      3. Meta-update: theta ← theta - beta * grad_theta sum_i L_Ti(theta_i')")
    print("  RL version (MAML-RL): use policy gradient as inner loss.")
    print("  Applications: robot locomotion adaptation, game playing with few demos.")

def ex50():
    """End-to-end RL comparison: Q-learning, SARSA, Dyna-Q"""
    def run_agent(method="q", n_episodes=400):
        Q = np.zeros((GRID_SIZE, GRID_SIZE, N_ACTIONS))
        model = {}
        rewards = []
        for ep in range(n_episodes):
            s=(0,0); G=0.0
            a = np.random.randint(N_ACTIONS) if np.random.rand()<0.1 else int(np.argmax(Q[s[0],s[1]]))
            for _ in range(200):
                ns,r,done=_step(s,a)
                na = np.random.randint(N_ACTIONS) if np.random.rand()<0.1 else int(np.argmax(Q[ns[0],ns[1]]))
                if method=="sarsa":
                    td = r if done else r+GAMMA*Q[ns[0],ns[1],na]
                else:
                    td = r if done else r+GAMMA*np.max(Q[ns[0],ns[1]])
                Q[s[0],s[1],a]+=0.1*(td-Q[s[0],s[1],a])
                if method=="dyna":
                    model[(s,a)]=(ns,r,done)
                    for _ in range(3):
                        sk,ak = list(model.keys())[np.random.randint(len(model))]
                        nsk,rk,dk=model[(sk,ak)]
                        tdk=rk if dk else rk+GAMMA*np.max(Q[nsk[0],nsk[1]])
                        Q[sk[0],sk[1],ak]+=0.1*(tdk-Q[sk[0],sk[1],ak])
                s=ns; a=na; G+=r
                if done: break
            rewards.append(G)
        return rewards
    r_ql  = run_agent("q")
    r_sar = run_agent("sarsa")
    r_dyn = run_agent("dyna")
    print("Ex50 — Final 20-ep avg rewards:")
    print("  Q-learning:", round(float(np.mean(r_ql[-20:])), 2))
    print("  SARSA:     ", round(float(np.mean(r_sar[-20:])), 2))
    print("  Dyna-Q:    ", round(float(np.mean(r_dyn[-20:])), 2))


def main():
    print("=" * 60)
    print("Examples 6.4 — Reinforcement Learning")
    print("=" * 60)
    print("\n--- BASIC (1-13) ---")
    ex01(); ex02(); ex03(); ex04(); ex05(); ex06(); ex07()
    ex08(); ex09(); ex10(); ex11(); ex12(); ex13()
    print("\n--- INTERMEDIATE (14-26) ---")
    ex14(); ex15(); ex16(); ex17(); ex18(); ex19(); ex20()
    ex21(); ex22(); ex23(); ex24(); ex25(); ex26()
    print("\n--- NESTED (27-38) ---")
    ex27(); ex28(); ex29(); ex30(); ex31(); ex32(); ex33()
    ex34(); ex35(); ex36(); ex37(); ex38()
    print("\n--- ADVANCED (39-50) ---")
    ex39(); ex40(); ex41(); ex42(); ex43(); ex44(); ex45()
    ex46(); ex47(); ex48(); ex49(); ex50()

if __name__ == "__main__":
    main()
