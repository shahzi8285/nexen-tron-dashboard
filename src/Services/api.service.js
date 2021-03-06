import axios from "axios";

export const apiService = {
    register,
    getUser,
    updateUser,
    getUserTree,
    getWinners,
    getTodayJoin
    
};


const CONSTANTS={
    BASE_URL:"https://xjgvjfezp4.execute-api.ap-south-1.amazonaws.com/prod/",
    REGISTER_PATH:"register",
    GET_USER:"user",
    GET_USER_TREE:"tree",
    GET_WINNERS:"getWinners",
    UPDATE_USER:"user",
    FETCH_TODAY_JOINED:"todayJoin"


}


async function register(user) {
    const URL = CONSTANTS.BASE_URL+CONSTANTS.REGISTER_PATH;
    return axios.post(URL, user);
}

async function getTodayJoin() {
    const URL = CONSTANTS.BASE_URL+CONSTANTS.FETCH_TODAY_JOINED;
    return axios.get(URL);
}


async function getUser(userId) {
    const URL = CONSTANTS.BASE_URL+CONSTANTS.GET_USER+"/"+userId;
    return axios.get(URL);
}


async function updateUser(user) {
    const URL = CONSTANTS.BASE_URL+CONSTANTS.UPDATE_USER+"/"+user.id;
    return axios.post(URL, user );

}


async function getUserTree(userId,levelNumber) {
    const URL = CONSTANTS.BASE_URL+CONSTANTS.GET_USER_TREE+"/"+levelNumber+"/"+userId;
    return axios.get(URL);
}





async function getWinners() {
    const URL = CONSTANTS.BASE_URL+CONSTANTS.GET_WINNERS;
    return axios.get(URL);
}









//TODO add todays Join api
