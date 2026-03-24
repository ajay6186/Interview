# ============================================================
# Solution 6.4 — Reinforcement Learning
# ============================================================

import numpy as np

GRID_SIZE = 10
N_ACTIONS = 4
GOAL = (9, 9)
GAMMA = 0.99


def _step(state, action):
    r, c = state
    if   action == 0: r = max(0, r - 1)
    elif action == 1: r = min(GRID_SIZE - 1, r + 1)
    elif action == 2: c = max(0, c - 1)
    else:             c = min(GRID_SIZE - 1, c + 1)
    done   = (r, c) == GOAL
    reward = 10.0 if done else -1.0
    return (r, c), reward, done


def epsilon_greedy_bandit(true_means: np.ndarray, n_steps: int = 1000,
                          epsilon: float = 0.1) -> tuple:
    k = len(true_means)
    Q_est = np.zeros(k)
    N     = np.zeros(k)
    total_reward = 0.0
    for _ in range(n_steps):
        if np.random.rand() < epsilon:
            arm = np.random.randint(k)
        else:
            arm = int(np.argmax(Q_est))
        reward = true_means[arm] + np.random.randn() * 0.1
        N[arm] += 1
        Q_est[arm] += (reward - Q_est[arm]) / N[arm]
        total_reward += reward
    return (round(total_reward, 2), np.round(Q_est, 4).tolist())


def ucb1_bandit(true_means: np.ndarray, n_steps: int = 1000) -> tuple:
    k = len(true_means)
    Q_est = np.zeros(k)
    N     = np.zeros(k)
    total_reward = 0.0
    # Pull each arm once
    for arm in range(k):
        reward = true_means[arm] + np.random.randn() * 0.1
        N[arm] = 1
        Q_est[arm] = reward
        total_reward += reward
    for t in range(k + 1, n_steps + 1):
        ucb = Q_est + np.sqrt(2 * np.log(t) / (N + 1e-10))
        arm = int(np.argmax(ucb))
        reward = true_means[arm] + np.random.randn() * 0.1
        N[arm] += 1
        Q_est[arm] += (reward - Q_est[arm]) / N[arm]
        total_reward += reward
    return (round(total_reward, 2), np.round(Q_est, 4).tolist())


def bellman_equation() -> str:
    return (
        "Bellman Optimality Equation:\n"
        "  V*(s) = max_a  sum_{s'} P(s'|s,a) * [R(s,a,s') + gamma * V*(s')]\n"
        "  Q*(s,a) = sum_{s'} P(s'|s,a) * [R(s,a,s') + gamma * max_{a'} Q*(s',a')]\n"
        "Deterministic version: V*(s) = max_a [R(s,a) + gamma * V*(next_state(s,a))]"
    )


def init_q_table() -> np.ndarray:
    return np.zeros((GRID_SIZE, GRID_SIZE, N_ACTIONS))


def q_learning_update(Q: np.ndarray, state: tuple, action: int, reward: float,
                      next_state: tuple, done: bool,
                      lr: float = 0.1, gamma: float = GAMMA) -> float:
    r, c = state
    nr, nc = next_state
    td_target = reward if done else reward + gamma * np.max(Q[nr, nc])
    td_error  = td_target - Q[r, c, action]
    Q[r, c, action] += lr * td_error
    return round(float(Q[r, c, action]), 6)


def q_learning(n_episodes: int = 500, lr: float = 0.1,
               epsilon: float = 0.1) -> tuple:
    Q = init_q_table()
    episode_rewards = []
    for ep in range(n_episodes):
        state = (0, 0)
        total_r = 0.0
        for _ in range(200):  # max steps per episode
            if np.random.rand() < epsilon:
                action = np.random.randint(N_ACTIONS)
            else:
                action = int(np.argmax(Q[state[0], state[1]]))
            next_state, reward, done = _step(state, action)
            q_learning_update(Q, state, action, reward, next_state, done, lr)
            state = next_state
            total_r += reward
            if done:
                break
        episode_rewards.append(round(total_r, 2))
    return (Q, episode_rewards)


def policy_evaluation(policy: np.ndarray, theta: float = 1e-4) -> np.ndarray:
    V = np.zeros((GRID_SIZE, GRID_SIZE))
    while True:
        delta = 0.0
        for r in range(GRID_SIZE):
            for c in range(GRID_SIZE):
                if (r, c) == GOAL:
                    continue
                v = 0.0
                for a in range(N_ACTIONS):
                    prob = policy[r, c, a]
                    (nr, nc), reward, done = _step((r, c), a)
                    v += prob * (reward + GAMMA * (0.0 if done else V[nr, nc]))
                delta = max(delta, abs(V[r, c] - v))
                V[r, c] = v
        if delta < theta:
            break
    return V


def policy_improvement(V: np.ndarray) -> np.ndarray:
    policy = np.zeros((GRID_SIZE, GRID_SIZE), dtype=int)
    for r in range(GRID_SIZE):
        for c in range(GRID_SIZE):
            if (r, c) == GOAL:
                continue
            q_vals = []
            for a in range(N_ACTIONS):
                (nr, nc), reward, done = _step((r, c), a)
                q_vals.append(reward + GAMMA * (0.0 if done else V[nr, nc]))
            policy[r, c] = int(np.argmax(q_vals))
    return policy


def value_iteration(theta: float = 1e-4) -> tuple:
    V = np.zeros((GRID_SIZE, GRID_SIZE))
    while True:
        delta = 0.0
        for r in range(GRID_SIZE):
            for c in range(GRID_SIZE):
                if (r, c) == GOAL:
                    continue
                q_vals = []
                for a in range(N_ACTIONS):
                    (nr, nc), reward, done = _step((r, c), a)
                    q_vals.append(reward + GAMMA * (0.0 if done else V[nr, nc]))
                v_new = max(q_vals)
                delta = max(delta, abs(V[r, c] - v_new))
                V[r, c] = v_new
        if delta < theta:
            break
    policy = policy_improvement(V)
    return (V, policy)


def sarsa_update(Q: np.ndarray, state: tuple, action: int, reward: float,
                 next_state: tuple, next_action: int, done: bool,
                 lr: float = 0.1, gamma: float = GAMMA) -> float:
    r, c = state
    nr, nc = next_state
    td_target = reward if done else reward + gamma * Q[nr, nc, next_action]
    td_error  = td_target - Q[r, c, action]
    Q[r, c, action] += lr * td_error
    return round(float(Q[r, c, action]), 6)


def epsilon_greedy_action(Q: np.ndarray, state: tuple, epsilon: float = 0.1) -> int:
    if np.random.rand() < epsilon:
        return int(np.random.randint(N_ACTIONS))
    r, c = state
    return int(np.argmax(Q[r, c]))


def reward_shaping_concept() -> str:
    return (
        "Potential-Based Reward Shaping adds a shaping bonus F(s,s') = gamma*Phi(s') - Phi(s) "
        "to the original reward, where Phi(s) is a potential function (e.g., negative distance to goal). "
        "Key property: PBRS preserves the optimal policy because the bonus sums to zero over any cycle. "
        "This speeds up learning without changing the optimal policy."
    )


def reinforce_concept() -> str:
    return (
        "REINFORCE (Williams 1992) — Monte Carlo Policy Gradient:\n"
        "  1. Run episode with policy pi_theta, collect trajectory (s,a,r).\n"
        "  2. Compute returns G_t = sum_{k=0}^{T-t} gamma^k * r_{t+k}.\n"
        "  3. Update: theta += alpha * sum_t G_t * grad_theta log pi_theta(a_t|s_t).\n"
        "  The gradient pushes up log-prob of actions that led to high returns.\n"
        "  High variance; baseline subtraction (actor-critic) reduces variance."
    )


def dqn_concept() -> str:
    return (
        "DQN (Deep Q-Network, Mnih et al. 2015) key components:\n"
        "  1. Q-network: neural net Q(s,a;theta) approximates Q*(s,a).\n"
        "  2. Experience replay: store (s,a,r,s',done) in replay buffer; "
        "sample random mini-batches to break correlations.\n"
        "  3. Target network: separate network Q(s,a;theta^-) updated every C steps "
        "for stable TD targets: y = r + gamma * max_a' Q(s',a';theta^-).\n"
        "  4. Loss: MSE between predicted Q and target y, minimized by gradient descent."
    )


def actor_critic_concept() -> str:
    return (
        "Actor-Critic (A2C/A3C) separates policy and value estimation:\n"
        "  Actor (policy network): pi_theta(a|s) — decides which action to take.\n"
        "  Critic (value network): V_w(s) — estimates expected return from s.\n"
        "  Update rule:\n"
        "    delta = r + gamma * V_w(s') - V_w(s)  [TD error / advantage]\n"
        "    Actor:  theta += alpha * delta * grad_theta log pi_theta(a|s)\n"
        "    Critic: w += beta * delta * grad_w V_w(s)\n"
        "  Advantage reduces variance vs REINFORCE. A3C uses async parallel workers."
    )


def main():
    print("=== Solution 6.4: Reinforcement Learning ===\n")

    np.random.seed(42)

    true_means = np.array([0.1, 0.5, 0.3, 0.8, 0.2])
    total_eps, est_eps = epsilon_greedy_bandit(true_means)
    print("Result 1  - Epsilon-greedy bandit:")
    print("           total reward={}, est means={}, best arm={}".format(
        total_eps, est_eps, int(np.argmax(est_eps))))

    total_ucb, est_ucb = ucb1_bandit(true_means)
    print("Result 2  - UCB1 bandit:")
    print("           total reward={}, est means={}, best arm={}".format(
        total_ucb, est_ucb, int(np.argmax(est_ucb))))

    print("Result 3  - Bellman equation:\n ", bellman_equation())

    Q = init_q_table()
    print("Result 4  - Q-table shape:", Q.shape)

    q_val = q_learning_update(Q.copy(), (0,0), 1, -1.0, (1,0), False)
    print("Result 5  - Q-learning update Q[(0,0),1]:", q_val)

    Q_trained, rewards = q_learning(n_episodes=500)
    print("Result 6  - Q-learning: last 5 rewards={}, best action from (0,0)={}".format(
        rewards[-5:], int(np.argmax(Q_trained[0, 0]))))

    policy_random = np.full((GRID_SIZE, GRID_SIZE, N_ACTIONS), 0.25)
    V = policy_evaluation(policy_random)
    print("Result 7  - Policy eval V[0,0]={:.4f}, V[9,8]={:.4f}".format(V[0,0], V[9,8]))

    pi = policy_improvement(V)
    action_names = ["up", "down", "left", "right"]
    print("Result 8  - Policy improvement pi[0,0]={} ({})".format(pi[0,0], action_names[pi[0,0]]))

    V_opt, pi_opt = value_iteration()
    print("Result 9  - Value iteration V[0,0]={:.4f}, V[9,8]={:.4f}".format(V_opt[0,0], V_opt[9,8]))
    print("           Optimal policy at (0,0):", action_names[pi_opt[0,0]])

    Q2 = init_q_table()
    sarsa_val = sarsa_update(Q2, (0,0), 1, -1.0, (1,0), 2, False)
    print("Result 10 - SARSA update Q[(0,0),1]:", sarsa_val)

    a = epsilon_greedy_action(Q_trained, (5,5), epsilon=0.0)  # greedy
    print("Result 11 - Greedy action at (5,5):", a, "=", action_names[a])

    print("Result 12 - Reward shaping:\n ", reward_shaping_concept())
    print("Result 13 - REINFORCE:\n ", reinforce_concept())
    print("Result 14 - DQN:\n ", dqn_concept())
    print("Result 15 - Actor-Critic:\n ", actor_critic_concept())


if __name__ == "__main__":
    main()
