#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, Address, Env, Map, String, Symbol, Vec};

#[contract]
pub struct PollContract;

const ADMIN: Symbol = symbol_short!("admin");
const QUESTION: Symbol = symbol_short!("question");
const OPTIONS: Symbol = symbol_short!("options");
const VOTES: Symbol = symbol_short!("votes");
const VOTERS: Symbol = symbol_short!("voters");

#[contractimpl]
impl PollContract {
    pub fn initialize(env: Env, admin: Address, question: String, options: Vec<String>) {
        admin.require_auth();
        env.storage().instance().set(&ADMIN, &admin);
        env.storage().instance().set(&QUESTION, &question);
        env.storage().instance().set(&OPTIONS, &options);

        let mut votes: Map<u32, u32> = Map::new(&env);
        for i in 0..options.len() {
            votes.set(i, 0);
        }
        env.storage().instance().set(&VOTES, &votes);
        env.storage().instance().set(&VOTERS, &Vec::<Address>::new(&env));
    }

    pub fn vote(env: Env, voter: Address, option_index: u32) {
        voter.require_auth();

        let voters: Vec<Address> = env
            .storage()
            .instance()
            .get(&VOTERS)
            .unwrap_or(Vec::new(&env));

        for v in voters.iter() {
            if v == voter {
                panic!("already voted");
            }
        }

        let options: Vec<String> = env.storage().instance().get(&OPTIONS).unwrap();
        if option_index >= options.len() {
            panic!("invalid option");
        }

        let mut votes: Map<u32, u32> = env.storage().instance().get(&VOTES).unwrap();
        let current = votes.get(option_index).unwrap_or(0);
        votes.set(option_index, current + 1);
        env.storage().instance().set(&VOTES, &votes);

        let mut voters: Vec<Address> = env
            .storage()
            .instance()
            .get(&VOTERS)
            .unwrap_or(Vec::new(&env));
        voters.push_back(voter.clone());
        env.storage().instance().set(&VOTERS, &voters);

        env.events().publish(
            (symbol_short!("vote"), voter, option_index),
            current + 1,
        );
    }

    pub fn get_question(env: Env) -> String {
        env.storage().instance().get(&QUESTION).unwrap()
    }

    pub fn get_options(env: Env) -> Vec<String> {
        env.storage().instance().get(&OPTIONS).unwrap()
    }

    pub fn get_votes(env: Env) -> Map<u32, u32> {
        env.storage().instance().get(&VOTES).unwrap()
    }

    pub fn has_voted(env: Env, voter: Address) -> bool {
        let voters: Vec<Address> = env
            .storage()
            .instance()
            .get(&VOTERS)
            .unwrap_or(Vec::new(&env));
        for v in voters.iter() {
            if v == voter {
                return true;
            }
        }
        false
    }

    pub fn get_total_voters(env: Env) -> u32 {
        let voters: Vec<Address> = env
            .storage()
            .instance()
            .get(&VOTERS)
            .unwrap_or(Vec::new(&env));
        voters.len()
    }
}
