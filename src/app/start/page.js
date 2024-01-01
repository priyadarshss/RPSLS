'use client'
import React, { useEffect, useState } from 'react'
import Web3 from 'web3'
import RPSContract from '../../contracts/RPS.json'
import Hasher from '../../contracts/Hasher.json'
import {
  moveMapping,
  resetGameState,
  saveGameState,
  win,
} from '../../utils'
import detectEthereumProvider from '@metamask/detect-provider'
import Image from 'next/image'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import JSConfetti from 'js-confetti'

function StartGame() {
  const [amount, setAmount] = useState('')
  const [opponentAddress, setOpponentAddress] = useState('')
  const [move, setMove] = useState('Rock')
  const [salt, setSalt] = useState(null)
  const [contractInstance, setContractInstance] = useState(null)
  const [opponentHasPlayed, setOpponentHasPlayed] = useState(false)
  const [recoverAvailable, setRecoverAvailable] = useState(false)
  const [selectedMoveImage, setSelectedMoveImage] = useState('Rock')
  const moves = ['Rock', 'Paper', 'Scissors', 'Lizard', 'Spock']
  const jsConfetti = new JSConfetti()

  const showToast = (message, type = 'success', duration = 5000) => {
    toast(message, {
      type,
      autoClose: duration,
    })
  }

  useEffect(() => {
    const pollOpponentMove = async () => {
      if (contractInstance) {
        const end = Date.now() + 300000
        const interval = setInterval(async () => {
          const moveOfOpponent = await contractInstance.methods.c2().call()
          if (Number(moveOfOpponent) !== 0) {
            setOpponentHasPlayed(true)
            clearInterval(interval)
          } else if (Date.now() > end) {
            setRecoverAvailable(true)
            clearInterval(interval)
          }
        }, 5000)
        return () => clearInterval(interval)
      }
    }

    pollOpponentMove()
  }, [contractInstance])

  const recoverFunds = async () => {
    const provider = await detectEthereumProvider()
    if (!provider) {
      showToast('Please install MetaMask to use this dapp!', 'error')
      return
    }

    try {
      const accounts = await connectAndFetchAccounts(provider)
      await contractInstance.methods.j2Timeout().send({ from: accounts[0] })
      await showAlertAndReload(
        'Success!',
        'Funds successfully recovered!',
        'success'
      ).then(resetGameState)
    } catch (error) {
      handleError(
        'An error occurred while recovering the funds: ' + error.message
      )
    }
  }

  const startGame = async (e) => {
    e.preventDefault()
    resetGameState()

    const provider = await detectEthereumProvider()
    if (!provider) {
      showToast('Please install MetaMask to use this dapp!', 'error')
      return
    }
    if (!(amount && opponentAddress && move)) {
      showToast('Cannot start game. Please fill all the fields.', 'error')
      return
    }

    try {
      await provider.request({ method: 'eth_requestAccounts' })
      const web3 = new Web3(window.ethereum)
      const accounts = await web3.eth.getAccounts()
      const moveInt = moveMapping[move]

      // Deploy Hasher Contract
      const HasherContract = new web3.eth.Contract(Hasher.abi)
      const hasherInstance = await HasherContract.deploy({
        data: Hasher.bytecode,
      }).send({ from: accounts[0] })
      const hasherContractAddress = hasherInstance.options.address
      console.log('acc', accounts)

      const generatedSalt = generateSalt()
      setSalt(generatedSalt)

      const hasherContract = new web3.eth.Contract(
        Hasher.abi,
        hasherContractAddress
      )
      async function getHash(moveInt, salt) {
        return await hasherContract.methods.hash(moveInt, salt).call()
      }
      const moveHash = await getHash(moveInt, generatedSalt)

      // Deploy RPS contract
      const RPSGame = new web3.eth.Contract(RPSContract.abi)
      const rpsGameInstance = await RPSGame.deploy({
        data: RPSContract.bytecode,
        arguments: [moveHash, opponentAddress],
      }).send({ from: accounts[0], value: web3.utils.toWei(amount, 'ether') })

      const message = (
        <div>
          Move registered! <br />
          You played - {move}. <br />
          Wait for your opponent to make their move now.
        </div>
      )

      showToast(message, 'success', 10000)
      saveGameState(generatedSalt, move, rpsGameInstance.options.address)

      setContractInstance(rpsGameInstance)
    } catch (error) {
      showToast(error.message, 'error')
    }
  }

  const checkWinner = async (e) => {
    e.preventDefault()
    const provider = await detectEthereumProvider()
    if (!provider) {
      showToast('Please install MetaMask to use this dapp!', 'error')
      return
    }
    if (!(contractInstance && salt)) {
      showToast(
        'Cannot check winner. Game not initialized or salt missing.',
        'error'
      )
      return
    }

    try {
      await provider.request({ method: 'eth_requestAccounts' })
      const web3 = new Web3(window.ethereum)
      const accounts = await web3.eth.getAccounts()
      const moveInt = moveMapping[move]

      // Call the solve function from the RPS contract instance
      await contractInstance.methods
        .solve(moveInt, salt)
        .send({ from: accounts[0] })

      // Get player-2's move
      const moveOfOpponent = await contractInstance.methods.c2().call()

      if (Number(moveOfOpponent) === moveMapping[move]) {
        showToast(
          `It's a tie! You both played ${move} and will get back your staked ETH`,
          'default',
          20000
        )
        resetGameState()
      } else if (win(moveMapping[move], Number(moveOfOpponent))) {
        showToast(`You won and are now ${amount} ETH richer!`, 'success', 20000)
        jsConfetti.addConfetti()
      } else {
        showToast(
          `You lost and your opponent is now ${amount} ETH richer :(`,
          'default',
          20000
        )
        resetGameState()
      }

    } catch (error) {
      handleError(
        'An error occurred while checking the winner: ' + error.message
      )
    }
  }

  const connectAndFetchAccounts = async (provider) => {
    await provider.request({ method: 'eth_requestAccounts' })
    const web3 = new Web3(window.ethereum)
    return await web3.eth.getAccounts()
  }

  const handleError = (errorMessage) => {
    showToast(errorMessage, 'error')
  }

  const handleMoveClick = (selectedMove) => {
    setMove(selectedMove)
    setSelectedMoveImage(selectedMove)
  }

  function generateSalt() {
    const randomBytes = new Uint8Array(32)
    window.crypto.getRandomValues(randomBytes)

    const timestamp = Math.floor(Date.now() / 1000)
    const salt = Web3.utils.sha3(randomBytes.join('') + timestamp)
    return salt
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-black text-white'>
      <ToastContainer />
      <div className='text-center flex flex-col items-center justify-cente w-full'>
        <h2 className='text-4xl font-normal mb-8 leading-normal'>
          Start New Game
        </h2>
        <form className='text-left w-2/5'>
          <label className='flex flex-row justify-between items-center mb-4'>
            Enter amount of ETH to stake:
            <input
              type='number'
              className='border border-gray-400 p-2 text-white text-sm bg-[#212121] rounded-2xl h-10 w-40'
              disabled={contractInstance}
              value={amount}
              placeholder='Ex: 0.1'
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          <label className='flex flex-row justify-between items-center mb-4'>
            Enter opponent&apos;s wallet address:
            <input
              type='text'
              className='border border-gray-400 p-2 text-white text-sm bg-[#212121] rounded-2xl h-10 w-40'
              disabled={contractInstance}
              value={opponentAddress}
              onChange={(e) => setOpponentAddress(e.target.value)}
            />
          </label>
          <h2 className='text-4xl font-normal mb-8 leading-normal text-center mt-10'>
            Pick Your Move
          </h2>
          <div className='flex flex-row justify-between items-center mb-4'>
            {moves.map((moveOption) => (
              <div
                key={moveOption}
                className={`flex flex-col items-center cursor-pointer ${
                  moveOption === selectedMoveImage
                    ? 'opacity-100'
                    : 'opacity-30'
                }`}
                onClick={() => handleMoveClick(moveOption)}
              >
                <Image
                  src={`/assets/${moveOption.toLowerCase()}.png`}
                  alt={moveOption}
                  width={80}
                  height={80}
                  className={`h-20 w-20 ${
                    moveOption === selectedMoveImage ? 'scale-110' : ''
                  }`}
                />
                <span>{moveOption}</span>
              </div>
            ))}
          </div>
          <div className='flex justify-center items-center'>
            <button
              className='bg-[#8575FF] text-white p-4 m-4 rounded-full hover:bg-[#6145ff] transition duration-300 ease-in-out'
              disabled={contractInstance}
              onClick={startGame}
            >
              Start Game
            </button>
            <button
              className={`bg-[#8575FF] ${
                !opponentHasPlayed && 'opacity-20'
              } text-white p-4 m-4 rounded-full hover:bg-[#6145ff] transition duration-300 ease-in-out`}
              disabled={!opponentHasPlayed}
              onClick={checkWinner}
            >
              Check Winner
            </button>
            <br />
            <button
              className='bg-[#8575FF] text-white p-4 m-4 rounded-full hover:bg-[#6145ff] transition duration-300 ease-in-out'
              disabled={!recoverAvailable}
              onClick={recoverFunds}
            >
              Recover ETH
            </button>
          </div>
          {contractInstance && (
            <h1 className='text-center mt-10'>
              Send this contract address to your opponent: <br />
              <span className='text-[#8575FF]'>
                {contractInstance?.options?.address}
              </span>
            </h1>
          )}
        </form>
      </div>
    </div>
  )
}

export default StartGame
