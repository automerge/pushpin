import React from "react";

export interface Props {
  docId: string;
}

export default function withPresence(WrappedComponent) {
  const PresenceContainer = class extends React.PureComponent<Props> {
    heartbeatTimerId: NodeJS.Timeout;

    componentWillUnmount = () => {
      this.heartbeatNotifyDeparture();
      clearInterval(this.heartbeatTimerId);
    };

    componentDidUpdate = (prevProps, prevState, snapshot) => {
      if (prevProps.docId !== this.props.docId) {
        this.heartbeatNotifyDeparture();
      }
    };

    refreshHeartbeat = () => {
      // XXX check how this work on board change
      if (!this.heartbeatTimerId) {
        // this.handle.message({ contact: this.props.selfId, heartbeat: true })
        this.heartbeatTimerId = setInterval(() => {
          // this.handle.message({ contact: this.props.selfId, heartbeat: true })
        }, 5000); // send a heartbeat every 5s
      }
    };

    heartbeatNotifyDeparture = () => {
      // notify peers on the current board that we're departing
      // this.handle.message({ contact: this.props.selfId, departing: true })
    };

    render() {
      return <WrappedComponent {...this.props} />;
    }
  };
  return PresenceContainer;
}
