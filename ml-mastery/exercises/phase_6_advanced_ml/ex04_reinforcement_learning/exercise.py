# ============================================================
# Exercise 6.4 — Reinforcement Learning
# ============================================================
# Topics:
#   • Multi-armed bandit (epsilon-greedy)
#   • UCB1 algorithm
#   • Bellman equation (grid world)
#   • Q-table initialization
#   • Q-learning update rule
#   • Q-learning on simple grid world (10x10)
#   • Policy evaluation (iterative)
#   • Policy improvement
#   • Value iteration
#   • SARSA update rule
#   • Epsilon-greedy exploration
#   • Reward shaping concept
#   • REINFORCE (policy gradient) concept
#   • DQN architecture concept
#   • Actor-Critic concept
# ============================================================

import numpy as np


# ============================================================
# Grid World Setup (10x10, terminal at (9,9), walls at edges)
# Actions: 0=up, 1=down, 2=left, 3=right
# Reward: -1 per step, +10 at goal (9,9)
# ============================================================
GRID_SIZE = 10
N_ACTIONS = 4
GOAL = (9, 9)
GAMMA = 0.99

def _step(state, action):
    """Return (next_state, reward, done)."""
    r, c = state
    if action == 0: r = max(0, r - 1)
    elif action == 1: r = min(GRID_SIZE - 1, r + 1)
    elif action == 2: c = max(0, c - 1)
    else: c = min(GRID_SIZE - 1, c + 1)
    done = (r, c) == GOAL
    reward = 10.0 if done else -1.0
    return (r, c), reward, done


# --- TODO 1: Multi-armed bandit (epsilon-greedy) ---
# k arms with true_means. Run n_steps with epsilon-greedy.
# Return (total_reward, estimated_means).
def epsilon_greedy_bandit(true_means: np.ndarray, n_steps: int = 1000,
                          epsilon: float = 0.1) -> tuple:
    pass  # TODO: implement


# --- TODO 2: UCB1 algorithm ---
# Upper Confidence Bound: select arm with max Q_a + sqrt(2*ln(t)/N_a).
# Return (total_reward, estimated_means).
def ucb1_bandit(true_means: np.ndarray, n_steps: int = 1000) -> tuple:
    pass  # TODO: implement


# --- TODO 3: Bellman equation ---
# V(s) = max_a sum_{s'} P(s'|s,a) [R(s,a,s') + gamma * V(s')]
# For deterministic grid world: V(s) = max_a [R(s,a) + gamma * V(s')].
# Return a string of the Bellman optimality equation.
def bellman_equation() -> str:
    pass  # TODO: implement


# --- TODO 4: Q-table initialization ---
# Return zero Q-table of shape (GRID_SIZE, GRID_SIZE, N_ACTIONS).
def init_q_table() -> np.ndarray:
    pass  # TODO: implement


# --- TODO 5: Q-learning update rule ---
# Q(s,a) += lr * [r + gamma * max_a' Q(s',a') - Q(s,a)]
# Return updated Q value.
def q_learning_update(Q: np.ndarray, state: tuple, action: int, reward: float,
                      next_state: tuple, done: bool,
                      lr: float = 0.1, gamma: float = GAMMA) -> float:
    pass  # TODO: implement


# --- TODO 6: Q-learning on grid world ---
# Train for n_episodes. Return (Q_table, episode_rewards list).
def q_learning(n_episodes: int = 500, lr: float = 0.1,
               epsilon: float = 0.1) -> tuple:
    pass  # TODO: implement


# --- TODO 7: Policy evaluation (iterative) ---
# Given a random policy (uniform over actions), compute V(s)
# by iterating until |delta| < theta.
# Return V of shape (GRID_SIZE, GRID_SIZE).
def policy_evaluation(policy: np.ndarray, theta: float = 1e-4) -> np.ndarray:
    pass  # TODO: implement


# --- TODO 8: Policy improvement ---
# Given V, return greedy policy: pi(s) = argmax_a [R(s,a) + gamma*V(s')].
# Return policy array of shape (GRID_SIZE, GRID_SIZE).
def policy_improvement(V: np.ndarray) -> np.ndarray:
    pass  # TODO: implement


# --- TODO 9: Value iteration ---
# Iterate V(s) = max_a [R(s,a) + gamma * V(s')] until convergence.
# Return (V, optimal_policy).
def value_iteration(theta: float = 1e-4) -> tuple:
    pass  # TODO: implement


# --- TODO 10: SARSA update rule ---
# Q(s,a) += lr * [r + gamma * Q(s',a') - Q(s,a)]
# Return updated Q value.
def sarsa_update(Q: np.ndarray, state: tuple, action: int, reward: float,
                 next_state: tuple, next_action: int, done: bool,
                 lr: float = 0.1, gamma: float = GAMMA) -> float:
    pass  # TODO: implement


# --- TODO 11: Epsilon-greedy exploration ---
# Return action: random with prob epsilon, greedy otherwise.
def epsilon_greedy_action(Q: np.ndarray, state: tuple, epsilon: float = 0.1) -> int:
    pass  # TODO: implement


# --- TODO 12: Reward shaping concept ---
# Return a string explaining potential-based reward shaping.
def reward_shaping_concept() -> str:
    pass  # TODO: implement


# --- TODO 13: REINFORCE concept ---
# Return a string explaining the REINFORCE policy gradient algorithm.
def reinforce_concept() -> str:
    pass  # TODO: implement


# --- TODO 14: DQN architecture concept ---
# Return a string describing the DQN components.
def dqn_concept() -> str:
    pass  # TODO: implement


# --- TODO 15: Actor-Critic concept ---
# Return a string explaining Actor-Critic (A2C/A3C).
def actor_critic_concept() -> str:
    pass  # TODO: implement


def main():
    print("=== Exercise 6.4: Reinforcement Learning ===\n")

    np.random.seed(42)

    true_means = np.array([0.1, 0.5, 0.3, 0.8, 0.2])
    total_eps, est_eps = epsilon_greedy_bandit(true_means) or (None, None)
    print("TODO 1  - Epsilon-greedy bandit total reward:", total_eps, "est means:", est_eps)

    total_ucb, est_ucb = ucb1_bandit(true_means) or (None, None)
    print("TODO 2  - UCB1 bandit total reward:", total_ucb, "est means:", est_ucb)

    print("TODO 3  - Bellman equation:", bellman_equation())

    Q = init_q_table()
    print("TODO 4  - Q-table shape:", Q.shape if Q is not None else None)

    if Q is not None:
        Q_new = q_learning_update(Q, (0,0), 1, -1.0, (1,0), False)
        print("TODO 5  - Q-learning update Q[(0,0),1]:", Q_new)

    Q_trained, rewards = q_learning(n_episodes=500) or (None, None)
    print("TODO 6  - Q-learning last 10 episode rewards:", rewards[-10:] if rewards else None)

    policy_random = np.full((GRID_SIZE, GRID_SIZE, N_ACTIONS), 0.25)
    V = policy_evaluation(policy_random) if policy_random is not None else None
    print("TODO 7  - Policy eval V[0,0]:", round(V[0,0], 4) if V is not None else None)

    if V is not None:
        pi = policy_improvement(V)
        print("TODO 8  - Policy improvement pi[0,0]:", pi[0,0] if pi is not None else None)

    V_opt, pi_opt = value_iteration() or (None, None)
    print("TODO 9  - Value iteration V[0,0]:", round(V_opt[0,0], 4) if V_opt is not None else None)

    Q2 = init_q_table() or np.zeros((GRID_SIZE, GRID_SIZE, N_ACTIONS))
    if Q2 is not None:
        sarsa_val = sarsa_update(Q2, (0,0), 1, -1.0, (1,0), 2, False)
        print("TODO 10 - SARSA update Q[(0,0),1]:", sarsa_val)

    if Q2 is not None:
        a = epsilon_greedy_action(Q2, (0,0), epsilon=0.1)
        print("TODO 11 - Epsilon-greedy action:", a)

    print("TODO 12 - Reward shaping:", reward_shaping_concept())
    print("TODO 13 - REINFORCE:", reinforce_concept())
    print("TODO 14 - DQN:", dqn_concept())
    print("TODO 15 - Actor-Critic:", actor_critic_concept())


if __name__ == "__main__":
    main()
