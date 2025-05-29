import { Component, createContext } from 'react'

const LoadingContext = createContext()

export class LoadingProvider extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loadingStates: {}
    }
  }

  setLoading = (key, isLoading) => {
    this.setState(prevState => ({
      loadingStates: {
        ...prevState.loadingStates,
        [key]: isLoading
      }
    }))
  }

  isLoading = (key) => {
    return Boolean(this.state.loadingStates[key])
  }

  isAnyLoading = () => {
    return Object.values(this.state.loadingStates).some(loading => loading)
  }

  clearLoading = (key) => {
    this.setState(prevState => {
      const newStates = { ...prevState.loadingStates }
      delete newStates[key]
      return { loadingStates: newStates }
    })
  }

  render () {
    const value = {
      setLoading: this.setLoading,
      isLoading: this.isLoading,
      isAnyLoading: this.isAnyLoading,
      clearLoading: this.clearLoading
    }

    return (
      <LoadingContext.Provider value={value}>
        {this.props.children}
      </LoadingContext.Provider>
    )
  }
}

export const LoadingConsumer = LoadingContext.Consumer
export { LoadingContext }
