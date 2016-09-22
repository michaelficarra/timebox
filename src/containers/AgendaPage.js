import React, {Component, PropTypes} from 'react';
import {ActivityIndicator, Text} from 'react-native';
import {fetchGithub} from '../github';
import {createAgenda} from '../agendas';
import Navigate from '../components/Navigate';
import Agenda from '../components/Agenda';

export default class AgendaPage extends Component {
  static contextTypes = {
    app: PropTypes.object.isRequired,
    isAuthorized: PropTypes.bool.isRequired,
    accessToken: PropTypes.string.isRequired,
  };

  static propTypes = {
    params: PropTypes.shape({
      agendaId: PropTypes.string.isRequired,
    }).isRequired,
  };

  state = {
    agenda: null,
    isInvalid: false,
    isLoading: false,
    isAgendaSelected: false,
  };

  setAgenda = async (agenda) => {
    const db = this.context.app.database();
    await Promise.all([
      db.ref('agenda').set(agenda),
      db.ref('timebox').remove(),
    ]);

    this.setState({isAgendaSelected: true});
  };

  async updateAgenda(props, context) {
    const {accessToken} = context;
    const {params: {agendaId}} = props;

    this.setState({agenda: null});

    setTimeout(() => {
      this.setState(({agenda, isInvalid}) => ({
        isLoading: !agenda && !isInvalid,
      }));
    }, 200);

    try {
      const id = agendaId.replace('-', '/');
      const url = `/repos/tc39/agendas/contents/${id}.md`;
      const res = await fetchGithub(url, {accessToken});
      if (res.ok) {
        const agenda = createAgenda(await res.json());
        this.setState({agenda});
      } else {
        this.setState({isInvalid: true});
      }
    } catch (e) {
      this.setState({isInvalid: true});
    }

    this.setState({isLoading: false});
  }

  componentDidMount() {
    this.updateAgenda(this.props, this.context);
  }

  componentWillReceiveProps(nextProps, nextContext) {
    if (nextProps.params.agendaId !== this.props.params.agendaId) {
      this.updateAgenda(nextProps, nextContext);
    }
  }

  render() {
    const {isAuthorized} = this.context;
    const {agenda, isLoading, isInvalid, isAgendaSelected} = this.state;

    if (isAgendaSelected) {
      return (
        <Navigate to='/agenda'/>
      );
    }

    if (isInvalid) {
      return (
        <Text>Agenda not found</Text>
      );
    }

    if (isLoading) {
      return (
        <ActivityIndicator color='black'/>
      );
    }

    return agenda ? (
      <Agenda
        agenda={agenda}
        onAgendaSelect={isAuthorized ? this.setAgenda : null}
      />
    ) : (
      null
    );
  }
}
