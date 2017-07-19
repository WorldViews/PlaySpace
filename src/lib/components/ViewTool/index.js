import React from 'react';
import {styles} from './styles.scss';
import _ from 'lodash';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';

import Icon from 'react-icons-kit';
import { ic_stars } from 'react-icons-kit/md/ic_stars';


export default class ViewTool extends React.Component {
    state = {
        value: 'None'
    }

    onMarkView(e) {
        console.log("onMarkView");
    }
    
    onChange(event, index, value) {
        this.setState({value:value});
        if (this.props.onChange)
            this.props.onChange(value);
    }

    render() {
        return (
            <div className={styles}>
                <input type="text" value="view" id="currentViewName"/>
                <input type="button" value="Mark"
            onClick = {
                //(e) => console.log("onMarkView")
                (e) => window.game.viewManager.bookmarkView()
            }
                />
                <SelectField
                    floatingLabelText="View"
                    value={this.state.value}
                    onChange={this.onChange.bind(this)}>
                    {_.map(this.props.callbacks, (callback, key) => (
                        <MenuItem
                            key={key}
                            value={callback.name}
                            primaryText={callback.name}
                        />
                    ))}
                </SelectField>
            </div>
        )
    }
};