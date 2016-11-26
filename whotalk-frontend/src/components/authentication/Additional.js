import React, {Component} from 'react';
import {Redirect} from 'react-router';
import {AdditionalForm} from './forms';
import autobind from 'autobind-decorator';
import notify from 'helpers/notify';
import {injectIntl, defineMessages} from 'react-intl';


const messages = defineMessages({
    almostThere: {
        id: "Additional.almostThere",
        defaultMessage: "YOU ARE ALMOST THERE"
    },
    pleaseTell: {
        id: "Additional.pleaseTell",
        defaultMessage: "PLEASE TELL US MORE ABOUT YOU"
    }
})


class Additional extends Component {
    constructor(props) {
        super(props);
        this.state = {
            animate: false,
            leave: false,
            path: '',
            invert: false
        };
    }

    @autobind
    leaveTo(path, invert = false) {
        this.setState({animate: true, path, invert});
        setTimeout(() => this.setState({leave: true}), 700)
    }

    componentDidMount() {
        $('.dropdown').dropdown();
        const { username, password } = this.props.accountInfo;
        if(username==='' || password==='') {
            //toastr.error('Oops, you took the wrong path!');
            notify({type: 'error', message: 'Oops, you took the wrong path!'});
            this.leaveTo('/auth/register');
        }
    }

    @autobind
    handleSelect(name, value) {
        const {FormActions} = this.props;
        FormActions.changeInput({form: 'additional', name, value})
    }

    @autobind
    async handleSubmit() {
        const { form, accountInfo, status, FormActions, AuthActions } = this.props;
        const { firstName, lastName, email, gender } = form;
        const { username, password } = accountInfo;

        AuthActions.setSubmitStatus({name: 'additional', value: true});

        notify.clear();
        
        const validation = {
            firstName: {
                regex: /^.{1,30}$/,
                message: 'First name should not be empty'
            },
            lastName: {
                regex: /^.{1,30}$/,
                message: 'Last name should not be empty'
            },
            email: {
                regex: /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i,
                message: 'Email is invalid'
            },
            gender: {
                regex: /(male|female)$/,
                message: 'Gender is not selected'
            }
        };

        const values = ['firstName', 'lastName', 'email', 'gender'];

        let error =false;

        for(let value of values) {
            if(!validation[value].regex.test(form[value])) {
                 //toastr.error(validation[value].message);
                 notify({type: 'error', message: validation[value].message});
                 FormActions.setInputError({form: 'additional', name: value, error: true});
                 error = true;
            } else {
                FormActions.setInputError({form: 'additional', name: value, error: false});
            }
        }

        if(!error) {
            await AuthActions.checkEmail(form.email);
            if (this.props.status.emailExists) {
                FormActions.setInputError({form: 'additional', name: 'email', error: true});
                notify({type: 'error', message: 'Oops, that email already exists. You might already have an account!'});
                error = true;
            } else {
                FormActions.setInputError({form: 'additional', name: 'email', error: false});
            }
        }


        if(error) {
            AuthActions.setSubmitStatus({name: 'additional', value: false});
            return;
        }

        try {
            await AuthActions.localRegister({
                username,
                password,
                familyName: lastName,
                givenName: firstName,
                gender,
                email
            });
        } catch (e) {
            //toastr.error('Oops, server rejected your request, please try again (' + e.response.data.message + ')');
            notify({type: 'error', message: 'Oops, server rejected your request, please try again (' + e.response.data.message + ')'});
            AuthActions.setSubmitStatus({name: 'additional', value: false});
            this.leaveTo('/auth');
            return;
        }

        AuthActions.setSubmitStatus({name: 'additional', value: false});
        notify({type: 'success', message: `Hello, ${firstName}! Please sign in.`});
        //toastr.success(`Hello, ${firstName}! Please sign in.`);
        this.leaveTo('/auth');
    }


    @autobind
    async handleBlur(e) {
        const { form, AuthActions, FormActions } = this.props;
        if(e.target.name==='email') {
            const result = await AuthActions.checkEmail(form.email);
            if (this.props.status.emailExists) {
                FormActions.setInputError({form: 'additional', name: 'email', error: true});
                notify({type: 'error', message: 'Oops, that email already exists. You might already have an account!'});
            } else {
                FormActions.setInputError({form: 'additional', name: 'email', error: false});
            }
        }
    }

    @autobind
    handleChange(e) {
        const {FormActions} = this.props;
        FormActions.changeInput({form: 'additional', name: e.target.name, value: e.target.value})
    }

    render() {
        const redirect = (<Redirect
            to={{
            pathname: this.state.path,
            state: {
                from: this.props.location
            }
        }}/>);

        const {handleSelect, handleChange, handleSubmit, handleBlur, leaveTo} = this;
        const {form, formError, status, intl: {
                formatMessage
            }} = this.props;

        return (
            <div className="additional">
                <div
                    className={"box bounceInRight " + (this.state.animate
                    ? 'bounceOutLeft'
                    : '')}>
                    <div className="title">{formatMessage(messages.almostThere)}</div>
                    <div className="subtitle">{formatMessage(messages.pleaseTell)}</div>
                    <AdditionalForm 
                        form={form} 
                        onSelect={handleSelect} 
                        onChange={handleChange} 
                        onSubmit={handleSubmit} 
                        onCancel={()=>leaveTo('/auth/register')}
                        onBlur={handleBlur} 
                        error={formError} 
                        status={status}
                    />
                </div>

                {this.state.leave
                    ? redirect
                    : undefined}
            </div>
        );
    }

    componentWillUnmount() {
        this.props.FormActions.formReset();
        this.props.AuthActions.resetRegisterStatus();
    }
}

export default injectIntl(Additional);