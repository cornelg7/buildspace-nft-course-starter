import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import NFTGallery from './utils/NFTGallery.json';
import Loading from './components/Loading';

// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const CONTRACT_ADDRESS = "0xa9AeA3047E223D77577843b62bE21A755bE5602c";
const OPENSEA_LINK = 'https://testnets.opensea.io/collection/squarenft-trbwbiyfpz';

const App = () => {

  /*
  * Just a state variable we use to store our user's public wallet. Don't forget to import useState.
  */
  const [currentAccount, setCurrentAccount] = useState("");
  
  // Store the current number of minted NFTs and the maximum number of NFTs
  const [NFTCounter, setNFTCounter] = useState({minted: 0, max: 0});

  // Store the chain ID
  const [chainId, setChainId] = useState(0);
  let CHAIN_ID = 0;

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // Success state
  const [successState, setSuccessState] = useState({})

  const checkIfWalletIsConnected = async () => {
    /*
    * First make sure we have access to window.ethereum
    */
    const { ethereum } = window;

    if (!ethereum) {
      console.log("Make sure you have metamask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }

    /*
    * Check if we're authorized to access the user's wallet
    */
    const accounts = await ethereum.request({ method: 'eth_accounts' });

    /*
    * User can have multiple authorized accounts, we grab the first one if its there!
    */
    if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account)
  
        const chainIdLocal = await ethereum.request({ method: 'eth_chainId' });
        CHAIN_ID = Number(chainIdLocal);
        setChainId(CHAIN_ID);
        // Setup listener! This is for the case where a user comes to our site
        // and ALREADY had their wallet connected + authorized.
        setupEventListener();
        loadNumberOfNFTsAndMAX();
    } else {
        console.log("No authorized account found")
    }
  }

  /*
  * Implement your connectWallet method here
  */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const chainIdLocal = await ethereum.request({ method: 'eth_chainId' });
      CHAIN_ID = Number(chainIdLocal);
      setChainId(CHAIN_ID);

      /*
      * Fancy method to request access to account.
      */
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      /*
      * Boom! This should print out public address once we authorize Metamask.
      */
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
      // Setup listener! This is for the case where a user comes to our site
      // and connected their wallet for the first time.
      setupEventListener();
      loadNumberOfNFTsAndMAX();
    } catch (error) {
      console.log(error)
    }
  }

  // Setup our listener.
  const setupEventListener = async () => {
    // Most of this looks the same as our function askContractToMintNft
    try {
      const { ethereum } = window;

      if (ethereum) {
        // Reload page on chain changed
        ethereum.on('chainChanged', (_chainId) => window.location.reload());

        // Same stuff again
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, NFTGallery.abi, signer);

        // THIS IS THE MAGIC SAUCE.
        // This will essentially "capture" our event when our contract throws it.
        // If you're familiar with webhooks, it's very similar to that!
        connectedContract.on("NewEpicNFTMinted", (from, tokenId) => {
          console.log(from, tokenId.toNumber())
          setSuccessState({tokenId: tokenId.toNumber()});
        });

        console.log("Setup event listener!")

      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }

  const askContractToMintNft = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, NFTGallery.abi, signer);

        console.log("Going to pop wallet now to pay gas...")
        let nftTxn = await connectedContract.makeAnEpicNFT();

        console.log("Mining...please wait.")
        setIsLoading(true);
        await nftTxn.wait();
        setIsLoading(false);
        
        console.log(`Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`);
        
        // Load the new counter numbers
        loadNumberOfNFTsAndMAX();

      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }

  const loadNumberOfNFTsAndMAX = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const chainIdLocal = await ethereum.request({ method: 'eth_chainId' });
        CHAIN_ID = Number(chainIdLocal);
        setChainId(CHAIN_ID);

        if (CHAIN_ID !== 4) {
          console.log(CHAIN_ID);
          console.log('Need to be on rinkeby');
          return;
        }
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, NFTGallery.abi, signer);

        let numberOfMintedNFTs = await connectedContract.getTotalNFTsMintedSoFar();
        numberOfMintedNFTs = Number(numberOfMintedNFTs);
        console.log('numberOfMintedNFTs', numberOfMintedNFTs);

        let maxNumberOfNFTs = await connectedContract.getMaxNFTsNumber();
        maxNumberOfNFTs = Number(maxNumberOfNFTs);
        console.log('maxNumberOfNFTs', maxNumberOfNFTs);

        setNFTCounter({minted: numberOfMintedNFTs, max: maxNumberOfNFTs});

      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }

  /*
  * This runs our function when the page loads.
  */
  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  // Render Methods
  const renderNotConnectedContainer = () => (
    <button onClick={connectWallet} className="cta-button connect-wallet-button">
      Connect to Wallet
    </button>
  );

  /*
  * We want the "Connect to Wallet" button to dissapear if they've already connected their wallet!
  */
  const renderMintUI = () => (
    <span>
      {isLoading ? (
        <Loading></Loading>
      ) : (
        <span>
          {successState?.tokenId !== undefined && (
            <p className="sub-text">
              <span className="opensea-link">Success! </span> 
              We've minted your NFT and sent it to your wallet. It may take a max of 10 min to show up on 🌊
              <a className="opensea-link" href={`https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${successState.tokenId}`} target="_blank" rel="noreferrer">OpenSea</a>
            </p>
          )}
          <button onClick={askContractToMintNft} className="cta-button connect-wallet-button">
            Mint NFT
          </button>
        </span>
      )}
    </span>
  )

  const renderOpenSeaLink = () => (
    <span>
      🌊
      <a href={OPENSEA_LINK} target='_blank' rel="noreferrer" className="cta-link opensea-link">
        See collection on Opensea
      </a>
    </span>
  )

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">My NFT Collection</p>
          <p className="sub-text">
            Each unique. Each beautiful. Discover your NFT today.
          </p>
          {currentAccount === "" && renderNotConnectedContainer()}
          {chainId === 4 ? (
            <span>
              {NFTCounter.max &&
              (<p className="sub-text">
                Currently minted: {NFTCounter.minted} / {NFTCounter.max}
              </p>)}
              {currentAccount !== "" && renderMintUI()}
              <p>
                {renderOpenSeaLink()}
              </p>
            </span>
          ) : (
            <p className="sub-text">Please change network to Rinkeby.</p>
          )}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
