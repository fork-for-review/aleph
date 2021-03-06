import React, { Component } from 'react';
import { defineMessages } from 'react-intl';
import { Waypoint } from 'react-waypoint';
import { SectionLoading, ErrorSection } from 'src/components/common';
import { queryNotifications } from 'src/actions';
import { selectNotificationsResult } from 'src/selectors';
import Notification from 'src/components/Notification/Notification';
import { enhancer } from 'src/util/enhancers';

import './NotificationList.scss';

const messages = defineMessages({
  no_notifications: {
    id: 'notifications.no_notifications',
    defaultMessage: 'There are no notifications',
  },
});


class NotificationList extends Component {
  constructor(props) {
    super(props);
    this.getMoreResults = this.getMoreResults.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate(prevProps) {
    if (!this.props.query.sameAs(prevProps.query)) {
      this.fetchIfNeeded();
    }
  }

  // componentWillUnmount() {
  // }

  getMoreResults() {
    const { query, result } = this.props;
    if (result && !result.isLoading && result.next && !result.isError) {
      this.props.queryNotifications({ query, next: result.next });
    }
  }

  fetchIfNeeded() {
    const { result, query } = this.props;
    if (!result.isLoading) {
      this.props.queryNotifications({ query });
    }
  }

  render() {
    const { result, intl } = this.props;

    return (
      <React.Fragment>
        { result.total === 0
          && (
          <ErrorSection
            visual="notifications"
            title={intl.formatMessage(messages.no_notifications)}
          />
          )
        }
        { result.total !== 0
          && (
          <ul className="NotificationList">
            {result.results.map(notif => <Notification key={notif.id} notification={notif} />)}
          </ul>
          )
        }
        <Waypoint
          onEnter={this.getMoreResults}
          bottomOffset="-300px"
          scrollableAncestor={window}
        />
        { result.isLoading && (
          <SectionLoading />
        )}
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { query } = ownProps;
  const result = selectNotificationsResult(state, query);
  return { query, result };
};

export default enhancer({
  mapDispatchToProps: { queryNotifications },
  mapStateToProps,
})(NotificationList);
