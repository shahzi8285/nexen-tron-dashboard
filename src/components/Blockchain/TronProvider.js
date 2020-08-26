
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import {
  Badge, Col, Row, Table, Button, Modal, Spinner,
  ModalHeader, ModalBody, ModalFooter
} from 'reactstrap';
import { incomeFetched, userFetched, onLevelUpdated } from "../../actions/web3Actions";
import { toast } from 'react-toastify';
import { compose } from 'redux';
import Level from '../../pages/dashboard/components/Level/Level'

import TronWeb from "tronweb";
import Utils from "../../utils";

const FOUNDATION_ADDRESS = "TWiWt5SEDzaEqS6kE5gandWMNfxR2B5xzg";

class TronProvider extends React.Component {


  constructor(props) {
    super(props);




    this.state = {
      user: {},
      income: {},
      mlm: null,
      selectedLevel: {
        position: 1,
        amount: 50000000000000000,
        icon: require("../../images/levels/l1.png"),
        isBought: 1,
        amountTag: "0.05",

        bgStartColor: "#621e94",
        bgEndColor: "#240b36",
        
      levelsPrice: [],
      referrals: [],
      totalUsers: 0,
      rewardWallet: 0,
      levelRewardWallet: 0,
      totalAmountDistributed: 0,
      loading: false,
      account: "0x",
      tronWeb: {
        installed: false,
        loggedIn: false,
      },
      }
    };
  }

  async componentDidMount() {
    // let userId =this.props.auth.userId
    // this.setState({userId:parseInt(this.props.auth.userId)})
    // await this.loadWeb3();
    // await this.loadBlockchainData();
    await this.initTron();
    console.log("tron initiated",this.state)

    if (!this.state.InitError) {
      // await this.initUsersFunds(userId);
      await this.initUser(1)
    }


  }

  async initTron() {
    await new Promise((resolve) => {
      const tronWebState = {
        installed: !!window.tronWeb,
        loggedIn: window.tronWeb && window.tronWeb.ready,
      };

      if (tronWebState.installed) {
        this.setState({
          tronWeb: tronWebState,
        });

        return resolve();
      }

      let tries = 0;

      const timer = setInterval(() => {
        if (tries >= 10) {
          const TRONGRID_API = "https://api.trongrid.io";

          window.tronWeb = new TronWeb(
            TRONGRID_API,
            TRONGRID_API,
            TRONGRID_API
          );

          this.setState({
            tronWeb: {
              installed: false,
              loggedIn: false,
            },
          });

          clearInterval(timer);
          return resolve();
        }

        tronWebState.installed = !!window.tronWeb;
        tronWebState.loggedIn = window.tronWeb && window.tronWeb.ready;

        if (!tronWebState.installed) return tries++;

        this.setState({
          tronWeb: tronWebState,
        });

        resolve();
      }, 100);
    });



    

    if (!this.state.tronWeb.loggedIn) {
      // Set default address (foundation address) used for contract calls
      // Directly overwrites the address object as TronLink disabled the
      // function call
      window.tronWeb.defaultAddress = {
        hex: window.tronWeb.address.toHex(FOUNDATION_ADDRESS),
        base58: FOUNDATION_ADDRESS,
      };

      window.tronWeb.on("addressChanged", () => {
        if (this.state.tronWeb.loggedIn) {
          return;
        }
        this.setState({
          tronWeb: {
            installed: true,
            loggedIn: true,
          },
        });
      });
    }
    await Utils.setTronWeb(window.tronWeb);
    this.fetchPlatformData();
    // this.startRegisterEventListener();
    this.startBuyLevelEventListner();
    this.setState({ account: window.tronWeb.defaultAddress.base58 });
  }

  startBuyLevelEventListner() {
    Utils.contract.buyLevelEvent().watch((err) => {
      if (err) {
        return console.log("Failed to BuyLevel", err);
      }

      window.location.reload();
    });
  }

async initUser(id){
  if(!Utils.contract){
    return;
  }
  console.log("initUser", "Gggg");
  console.log("Utils.contract");
  Utils.contract
  .getUserInfo(id)
  .call()
  .then((User) => {
    Utils.contract
      .getUsersIncomes(id)
      .call()
      .then((Income) => {
        Utils.contract
      .getUsersFundsAndUserAddress(id)
      .call()
      .then((Fund) => {
        Utils.contract
        .viewUserReferral(id)
        .call()
        .then((res) => {
        var user = {}
        const inviter = TronWeb.address.fromHex(User.inviter);
        const totalReferals = User.totalReferals.toNumber();
        const totalRecycles = User.totalRecycles.toNumber();
        const totalWins = User.totalWins.toNumber();
        const levelsPurchased = User.levelsPurchased.toNumber();
        const loss = User.loss.toNumber() / 1000000;

        user={
          inviter: inviter,
          totalReferals: totalReferals,
          totalRecycles: totalRecycles,
          totalWins: totalWins,
          levelsPurchased: levelsPurchased,
          loss: loss,
        };

        var income={};
        let directIncome = Income.directIncome.toNumber() / 1000000;
        let rewardIncome = Income.rewardIncome.toNumber() / 1000000;
        let levelIncome = Income.levelIncome.toNumber() / 1000000;
        let recycleIncome = Income.recycleIncome.toNumber() / 1000000;
        let upgradeIncome = Income.upgradeIncome.toNumber() / 1000000;
        let levelRewardIncome = Income.levelRewardIncome.toNumber() / 1000000;

        income={
          directIncome: directIncome,
          rewardIncome: rewardIncome,
          levelIncome: levelIncome,
          recycleIncome: recycleIncome,
          upgradeIncome: upgradeIncome,
          levelRewardIncome: levelRewardIncome,
        }

        var fund={};
        let levelFund = Fund.levelFund.toNumber() / 1000000;
        let recycleFund = Fund.recycleFund.toNumber() / 1000000;
        let walletAddress = TronWeb.address.fromHex(Fund.add);

        fund={
          levelFund: levelFund,
          recycleFund: recycleFund,
          walletAddress: walletAddress,
        }; 

        for (let i = 0; i < res.length; i++) {
          console.log(res[i].toNumber());
        }

        this.setState({ user })
        this.setState({ income })
        this.setState({ fund })
        this.props.dispatch(userFetched(user));
        this.props.dispatch(incomeFetched(income));
        console.log(user,income,fund);
      });
      });
    });
  });

}


  async buyLevel(level) {

    Utils.contract
      .buyLevel(level)
      .send({
        from: window.tronWeb.defaultAddress.base58,
        callValue: this.state.levelsPrice[level - 1],
        shouldPollResponse: true,
      })
      .then((receipt) => {
        console.log(receipt);
      })
      .catch((err) => {
        console.log("error in buying ", err);
      });
  }


  async fetchPlatformData() {
    const totalUsers = (await Utils.contract.totalUsers().call()).toNumber();
    const entryFees = (await Utils.contract.levels(0).call()).toNumber();
    this.setState({
      entryFees: entryFees,
    });


    const levels = []

    for (var i = 1; i <= 10; i++) {
      let tempLevelsPrice = (await Utils.contract.levels(i).call()).toNumber();
      // console.log(tempLevelsPrice);
      levels.push(tempLevelsPrice)

    }

    this.setState({
      levelsPrice: levels,
    });
    const totalAmountDistributed = (
      await Utils.contract.totalAmountDistributed().call()
    ).toNumber();
    const rewardWallet = (
      await Utils.contract.rewardWallet().call()
    ).toNumber();
    const levelRewardWallet = (
      await Utils.contract.levelRewardWallet().call()
    ).toNumber();
    this.setState({
      totalUsers: totalUsers,
      totalAmountDistributed: totalAmountDistributed,
      rewardWallet: rewardWallet,
      levelRewardWallet: levelRewardWallet,
    });
    // console.log("totalUsers", totalUsers);
    // console.log("totalAmountDistributed", totalAmountDistributed / 1000000);
    // console.log("rewardWallet", rewardWallet / 1000000);
    // console.log("levelRewardWallet", levelRewardWallet / 1000000);
  }



  // async getUserInfo(id) {
  //   Utils.contract
  //     .getUserInfo(id)
  //     .call()
  //     .then((res) => {
  //       // console.log(res);
  //       const inviter = TronWeb.address.fromHex(res.inviter);
  //       const totalReferals = res.totalReferals.toNumber();
  //       const totalRecycles = res.totalRecycles.toNumber();
  //       const totalWins = res.totalWins.toNumber();
  //       const levelsPurchased = res.levelsPurchased.toNumber();
  //       const loss = res.loss.toNumber() / 1000000;

  //       this.setState({
  //         inviter: inviter,
  //         totalReferals: totalReferals,
  //         totalRecycles: totalRecycles,
  //         totalWins: totalWins,
  //         levelsPurchased: levelsPurchased,
  //         loss: loss,
  //       });
  //       // console.log(
  //       //   "inviter",
  //       //   inviter,
  //       //   "totalReferals",
  //       //   totalReferals,
  //       //   "totalRecycles",
  //       //   totalRecycles,
  //       //   "totalWins",
  //       //   totalWins,
  //       //   "levelsPurchased",
  //       //   levelsPurchased,
  //       //   "loss",
  //       //   loss
  //       // );
  //     })
  //     .catch((err) => {
  //       console.log("error", err);
  //     });
  // }



  // async getUsersIncomes(id) {
  //   Utils.contract
  //     .getUsersIncomes(id)
  //     .call()
  //     .then((res) => {
  //       let directIncome = res.directIncome.toNumber() / 1000000;
  //       let rewardIncome = res.rewardIncome.toNumber() / 1000000;
  //       let levelIncome = res.levelIncome.toNumber() / 1000000;
  //       let recycleIncome = res.recycleIncome.toNumber() / 1000000;
  //       let upgradeIncome = res.upgradeIncome.toNumber() / 1000000;
  //       let levelRewardIncome = res.levelRewardIncome.toNumber() / 1000000;

  //       this.setState({
  //         directIncome: directIncome,
  //         rewardIncome: rewardIncome,
  //         levelIncome: levelIncome,
  //         recycleIncome: recycleIncome,
  //         upgradeIncome: upgradeIncome,
  //         levelRewardIncome: levelRewardIncome,
  //       });
  //       // console.log("directIncome", directIncome);
  //       // console.log("rewardIncome", rewardIncome);
  //       // console.log("levelIncome", levelIncome);
  //       // console.log("recycleIncome", recycleIncome);
  //       // console.log("upgradeIncome", upgradeIncome);
  //       // console.log("levelRewardIncome", levelRewardIncome);
  //     });
  // }

  // async getUsersFunds(id) {
  //   Utils.contract
  //     .getUsersFundsAndUserAddress(id)
  //     .call()
  //     .then((res) => {
  //       let levelFund = res.levelFund.toNumber() / 1000000;
  //       let recycleFund = res.recycleFund.toNumber() / 1000000;
  //       let walletAddress = TronWeb.address.fromHex(res.add);

  //       this.setState({
  //         levelFund: levelFund,
  //         recycleFund: recycleFund,
  //         walletAddress: walletAddress,
  //       });
  //       console.log(levelFund);
  //       console.log(recycleFund);
  //       console.log(walletAddress);
  //     });
  // }


  async getUserReferrals(id) {
    Utils.contract
      .viewUserReferral(id)
      .call()
      .then((res) => {
        for (let i = 0; i < res.length; i++) {
          console.log(res[i].toNumber());
        }
      })
      .catch((err) => {
        console.log("error while fetching referrals", err);
      });
  }




  showBuyLevelDialog(level) {
    this.setState({ visibleBuyModal: true, selectedLevel: level })

  }









  getLevels(levelNumber) {
    console.log("^^^^^^^^^^^^^^^^", levelNumber)
    var levels = [];


    levels.push({
      position: 1,
      amount: 50000000000000000,
      icon: require("../../images/levels/l1.png"),
      isBought: levelNumber >= 1,
      amountTag: "0.05",

      bgStartColor: "#621e94",
      bgEndColor: "#240b36"
    })

    levels.push({
      position: 2,
      amount: 100000000000000000,
      icon: require("../../images/levels/l2.png"),
      isBought: levelNumber >= 2,
      amountTag: "0.10",

      bgStartColor: "#0984e3",
      bgEndColor: "#06508a"

    })


    levels.push({
      position: 3,
      amount: 150000000000000000,
      amountTag: "0.15",

      icon: require("../../images/levels/l3.png"),
      isBought: levelNumber >= 3,
      bgStartColor: "#fdcb6e",
      bgEndColor: "#bf8415",

    })


    levels.push({
      position: 4,
      amount: 2000,
      amountTag: "0.20",

      icon: require("../../images/levels/l4.png"),
      isBought: levelNumber >= 4,
      bgStartColor: "#787777",
      bgEndColor: "#a8a8a8"

    })


    levels.push({
      position: 5,
      amount: 2500,
      icon: require("../../images/levels/l5.png"),
      isBought: levelNumber >= 5,
      amountTag: "0.25",

      bgStartColor: "#961516",
      bgEndColor: "#d63031"
    })


    levels.push({
      position: 6,
      amount: 3000,
      amountTag: "0.30",

      icon: require("../../images/levels/l6.png"),
      isBought: levelNumber >= 6,
      bgStartColor: "#0984e3",
      bgEndColor: "#06508a"
    })


    levels.push({
      position: 7,
      amount: 3500,
      icon: require("../../images/levels/l7.png"),
      isBought: levelNumber >= 7,
      amountTag: "0.35",

      bgStartColor: "#621e94",
      bgEndColor: "#240b36"
    })


    levels.push({
      position: 8,
      amount: 4000,
      amountTag: "0.40",

      icon: require("../../images/levels/l8.png"),
      isBought: levelNumber >= 8,
      bgStartColor: "#fdcb6e",
      bgEndColor: "#bf8415"
    })


    levels.push({
      position: 9,
      amount: 4500,
      amountTag: "0.45",

      icon: require("../../images/levels/l9.png"),
      isBought: levelNumber >= 9,
      bgStartColor: "#787777",
      bgEndColor: "#a8a8a8"

    })


    levels.push({
      position: 10,
      amountTag: "0.50",

      amount: 5000,
      icon: require("../../images/levels/l10.png"),
      isBought: levelNumber >= 10,
      bgStartColor: "#961516",
      bgEndColor: "#d63031"
    })
    var level = null;
    if (levelNumber == 10) {
      level = levels[9]
      level.isThisNextLevel = true
    } else {
      level = levels[levelNumber]
      level.isThisNextLevel = true
    }



    // this.setState({selectedLevel:level})
    return levels

  }




  makeErrorToast(error) {
    toast.error(error, {
      position: "bottom-center",
      autoClose: 7000,
      hideProgressBar: true,
      closeOnClick: false,
      pauseOnHover: true,
      draggable: false
    });

  }



  renderBuyDialog() {
    return <>

      <Modal isOpen={this.state.visibleBuyModal} >
        <ModalHeader><h3 className="fw-semi-bold" >Buy Level
            {this.state.selectedLevel ? " " + this.state.selectedLevel.position : ""}</h3></ModalHeader>
        <ModalBody>

          <Row>

            <Col>



              <Level


                levelData={this.state.selectedLevel}
                enable={true}
                onLevelClicked={() => {

                }}
              /></Col>



            <Col>

              <h2>Buy Level {this.state.selectedLevel.position}+ {" "}</h2>
              <hr className="solid" />
              <Row>


                <Col>
                  <h4>Buy Level {this.state.selectedLevel.position}+ {" "}</h4>
                  <h4>Buy Level {this.state.selectedLevel.position}+ {" "}</h4>

                </Col>

                {/* <Spinner color="secondary" /> */}


                <Col>
                  <h4>Buy Level {this.state.selectedLevel.position}+ {" "}</h4>
                  <h4>Buy Level {this.state.selectedLevel.position}+ {" "}</h4>

                </Col>
              </Row>

            </Col>




          </Row>

        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={() => {
            this.buyLevel(this.state.selectedLevel.position, this.state.selectedLevel.amount, (receipt => {
              console.log("gffgfgg", receipt)
              toast.success("Successfully bought level " + this.state.selectedLevel.position, {
                position: "bottom-center",
                autoClose: 7000,
                hideProgressBar: true,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: false
              });

              this.setState({ visibleBuyModal: false })
              window.location.reload();

            }))
          }} >Pay
            {this.state.selectedLevel ? " " + this.state.selectedLevel.amountTag + " ETH" : ""}</Button>{' '}


          <Button color="danger" onClick={() => {
            this.setState({ visibleBuyModal: false })
          }}>Cancel</Button>
        </ModalFooter>
      </Modal>

    </>
  }




  render() {
    return (

      <>

        {this.state.visibleBuyModal ? this.renderBuyDialog() : null}
      </>
    );
  }
}

function mapStateToProps(store) {
  return {
    auth: store.auth
  };
}

export default connect(mapStateToProps, null, null, { withRef: true })(TronProvider);

