import Head from "next/head";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import styles from "../styles/Home.module.css";
import Web3Modal from "web3modal";
import { Contract, providers, utils } from "ethers";
import { NFT_CONTRACT_ABI, NFT_CONTRACT_ADDRESS } from "../constants";

export default function Home() {
  const [isOwner, setIsOwner] = useState(false);
  const [presaleStarted, setPresaleStarted] = useState(false);
  const [presaleEnded, setPresaleEnded] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [numTokenMinted, SetNumTokenMinted] = useState("");
  const [loading, setLoading] = useState(false);

  const web3ModalRef = useRef();

  const getNumMintedTokens = async () => {
    try {
      const provider = await getProviderOrSigner();

      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        provider
      );

      const numTokenIds = await nftContract.tokenIds();
      SetNumTokenMinted(numTokenIds.toString());
    } catch (err) {
      console.error(err);
    }
  };

  const presaleMint = async () => {
    setLoading(true);
    try {
      const signer = await getProviderOrSigner(true);

      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        signer
      );

      const txn = await nftContract.presaleMint({
        value: utils.parseEther("0.01"),
      });

      await txn.wait();

      window.alert("You successfully minted a CryptoDev!");
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const publicMint = async () => {
    setLoading(true);
    try {
      const signer = await getProviderOrSigner(true);

      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        signer
      );

      const txn = await nftContract.mint({
        value: utils.parseEther("0.01"),
      });

      await txn.wait();

      window.alert("You successfully minted a CryptoDev!");
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const getOwner = async () => {
    try {
      const signer = await getProviderOrSigner(true);

      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        signer
      );

      const owner = await nftContract.owner();
      const userAddress = await signer.getAddress();

      if (owner.toLowerCase() === userAddress.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startPresale = async () => {
    setLoading(true);
    try {
      const signer = await getProviderOrSigner(true);

      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        signer
      );

      const txn = await nftContract.startPresale();
      await txn.wait();

      setPresaleStarted(true);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const checkIfPresaleEnded = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        provider
      );

      const presaleEndTime = await nftContract.presaleEnded();
      const currentTimeInSeconds = Date.now() / 1000;

      const hasPresaleEnded = presaleEndTime.lt(
        Math.floor(currentTimeInSeconds)
      );

      setPresaleEnded(hasPresaleEnded);
    } catch (err) {
      console.error(err);
    }
  };

  const checkIfPresaleStarted = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        provider
      );

      const isPresaleStarted = await nftContract.presaleStarted();
      setPresaleStarted(isPresaleStarted);

      return isPresaleStarted;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const connectWallet = async () => {
    await getProviderOrSigner();
    setWalletConnected(true);
  };

  const getProviderOrSigner = async (needSinger = false) => {
    try {
      const provider = await web3ModalRef.current.connect();
      const web3Provider = new providers.Web3Provider(provider);

      const { chainId } = await web3Provider.getNetwork();
      if (chainId !== 5) {
        window.alert("Change the network to Goerli");
        throw new Error("Change network to Goerli");
      }

      if (needSinger) {
        const signer = web3Provider.getSigner();
        return signer;
      }

      return web3Provider;
    } catch (err) {
      console.error(err);
    }
  };

  const onPageLoad = async () => {
    await connectWallet();
    await getOwner();
    const presaleStarted = checkIfPresaleStarted();
    if (presaleStarted) {
      await checkIfPresaleEnded();
    }
    await getNumMintedTokens();

    // Track in real time the number of minted NFTs
    setInterval(async () => {
      await getNumMintedTokens();
    }, 5000);

    // Track in reak time the status of presale (started, ended, whatever)
    setInterval(async () => {
      const presaleStarted = await checkIfPresaleStarted();
      if (presaleStarted) {
        await checkIfPresaleEnded();
      }
    }, 5000);
  };

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      });
    }

    onPageLoad();
  }, []);

  function renderBody() {
    if (!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect your Wallet
        </button>
      );
    }

    if (loading) {
      return <span className={styles.description}>Loading...</span>;
    }

    if (isOwner && !presaleStarted) {
      // render a button to start the presale
      return (
        <button onClick={startPresale} className={styles.button}>
          Start Presale
        </button>
      );
    }

    if (!presaleStarted) {
      // just say that presale hasnt started yet, come back later
      return (
        <div>
          <span className={styles.description}>
            Presale has not started yet. Come back later!
          </span>
        </div>
      );
    }

    if (presaleStarted && !presaleEnded) {
      // allow users to mint in presale
      // they need to be in whitelist for this work
      return (
        <div>
          <span className={styles.description}>
            Presale has started! If your address is whitelisted, you can mint
            CryptoDev!
          </span>
          <button className={styles.button} onClick={presaleMint}>
            Presale Mint 🚀
          </button>
        </div>
      );
    }

    if (presaleEnded) {
      // allow users to take part in public sale
      return (
        <div>
          <span className={styles.description}>
            Presale has ended. You can mint a CryptoDev in public sale, if any
            remain.
          </span>
          <button className={styles.button} onClick={publicMint}>
            Public Mint 🚀
          </button>
        </div>
      );
    }
  }

  return (
    <div>
      <Head>
        <title>Crypto Devs NFT</title>
      </Head>

      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to CryptoDevs NFT</h1>
          <div className={styles.description}>
            CryptoDevs NFT is for developers in web3
          </div>
          <div className={styles.description}>
            {numTokenMinted}/20 have been minted already!
          </div>

          {renderBody()}
        </div>
        <img src="/cryptodevs/0.svg" className={styles.imgae} />
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  );
}
