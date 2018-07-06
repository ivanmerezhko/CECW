import React, { Component } from 'react'
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    Image,
    PermissionsAndroid,
    Platform,
    ASyncStorage,
    ScrollView,
    Keyboard
} from "react-native";
import { Dimensions } from 'react-native';

import { width, height } from 'react-native-dimension'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { EventRegister } from 'react-native-event-listeners'
import Spinner from 'react-native-spinkit'
import { NavigationActions } from 'react-navigation'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { ActionCreators } from '../../actions'

import LogIn from './LogIn'
import Modal from 'react-native-modal'
import { lookupIdentifier, addRego, getAvailablePromotions } from '../../lib/api';
import { colors } from "../../config/styles"
import images from "../../config/images"

GLOBAL = require('@global/globals');

const deviceHeight = Dimensions.get('window').height;
const deviceWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
    textInput: {
        fontSize: 20,
        padding: 0,
        paddingLeft: 10,
        paddingRight: 10,
        flex: 1,
        marginLeft: 20,
        marginRight: 20,
        borderColor: colors.borderColor,
        borderWidth: 1,
        color: colors.black
    },
    modalContainer: {
        padding: 1,
        width: width(50),
        height: width(15),
        marginTop: -width(11) - 5,
        marginLeft: width(30) - 50,
        backgroundColor: colors.transparent
    },
    modalContent: {
        flex: 1,
        marginTop: 10,
        padding: 5,
        backgroundColor: colors.buttonBackgroundColor,
        borderRadius: 5,
        borderColor: colors.borderColor,
        borderWidth: 1,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 2,
        shadowOpacity: 0.3,
        elevation: Platform.OS === "android" ? 2 : 0
    },
    textContent: {
        fontSize: 25,
        backgroundColor: colors.transparent,
        color: colors.black,
        textAlign: 'center'
    },
    button: {
        width: 90,
        height: 50,
        alignSelf: "center",
        justifyContent: "center",
        backgroundColor: colors.buttonBackgroundColor,
        borderRadius: 5,
        borderColor: colors.borderColor,
        borderWidth: 1
    },
    numberButton: {
        flex: 1,
        marginRight: 10,
        borderRadius: 5,
        backgroundColor: colors.buttonBackgroundColor,
        borderWidth: 1,
        justifyContent: "center",
        aspectRatio: 1
    }
});

class LogInContainer extends Component {
    static navigationOptions = { title: "Welcome", header: null };

    constructor(props) {
        super(props);
        this.initialState = {
            currentPage: 0,
            isLoading: false,
            error: '',
            user: this.props.user,
            identifier: '',
            identifier1: '',
            regoNameLengthVisible: false,
            modalVisible: false,
            email: '',
            addNewVisible: false,
            selectedField: 0,
            username: '',
            password: '',
            addLeftArrow: false,
            addRightArrow: true,
            firstName: '',
            lastName: '',
            userstate1: 0,
            locationID: 0
        };
        this.state = this.initialState;
        this.currentUser = null;
    }

    componentDidMount(){
        this.setState({username: this.props.navigation.state.params.username, password: this.props.navigation.state.params.password});
        this.state.locationID = this.props.navigation.state.params.locationID;

        getAvailablePromotions(this.state.username, this.state.password).then( response => {
            if (response.result === false) {
                console.log("response: ", response);
            }
            else {
                GLOBAL.PromotionList = response.promotions;
            }
        })
        .catch((error) => {
            console.log("error: ", error);
        });
    }

    addRegoButtonTapped(flag) {
        if (flag === false) {
            if (this.state.identifier.length > 6) {
                this.setState({ regoNameLengthVisible: true });
                return;
            }
        }
        this.setState({ selectedField: 0 });
        this.addNewRego();
    }

    updateText(text) {
        //tempText = this.state.selectedField === 0 ? this.state.identifier : this.state.email;
        if (this.state.selectedField === 0 ) {
            tempText = this.state.identifier;
        }
        else if (this.state.selectedField === 1) {
            tempText = this.state.email;
        }
        else if (this.state.selectedField === 2) {
            tempText = this.state.firstName;
        }
        else if (this.state.selectedField === 3) {
            tempText = this.state.lastName;
        }

        if (text === 'back') {
            tempText = tempText.slice(0, tempText.length - 1);
        }
        else {
            tempText += text;
        }
        if (this.state.selectedField === 0 ) {
            this.setState({ identifier: tempText });
        }
        else if (this.state.selectedField === 1) {
            this.setState({ email: tempText });
        }
        else if (this.state.selectedField === 2) {
            this.setState({ firstName: tempText });
        }
        else if (this.state.selectedField === 3) {
            this.setState({ lastName: tempText});
        }
    }

    loginButtonTapped() {
        if(this.state.identifier == ""){
            alert("Please input rego or last name.");
            return;
        }
        this.setState({ isLoading: true });
        this.setState({ email: ""});
        lookupIdentifier(this.state.identifier, this.state.username, this.state.password).then( response => {

            if (response.result === false) {
                this.setState({ addNewVisible: true, error: response.message });
            }
            else {
                let users = [];
                let tempKey = 0;
                for ( ; ; tempKey += 1) {
                    if (response.users[`${tempKey}`] !== undefined) {
                        users.push(response.users[`${tempKey}`]);
                    }
                    else {
                        break;
                    }
                }
                this.setState({ addNewVisible: false, selectedField: 0 })
                if (users[0].washcodes.length >= 1)
                    this.state.userstate1 = 0;
                else 
                    this.state.userstate1 = 1;
                if (users.length === 1 ) {
                    if (users[0].vehicleRegistrations.length === 1)
                    {
                        this.setState({ identifier: '' });
                        this.props.navigation.navigate('Dashboard', { user: users[0], regoNumber: 0, userstate: this.state.userstate1, username: this.state.username, password: this.state.password, locationID: this.state.locationID });
                    }
                    else {
                        let i = 0;
                        for ( i = 0; i < users[0].vehicleRegistrations.length; i += 1) {
                            if (users[0].vehicleRegistrations[i].registrationNumber === this.state.identifier) {
                                break;
                            }
                        }
                        if (i === users[0].vehicleRegistrations.length) {
                            this.props.navigation.navigate('SearchName', { users: users, keyword: this.state.identifier, username: this.state.username, password: this.state.password, locationID: this.state.locationID });
                            this.setState({ identifier: '' });
                            
                        }
                        else {
                            this.setState({ identifier: '' });
                            this.props.navigation.navigate('Dashboard', { user: users[0], regoNumber: i, userstate: this.state.userstate1, username: this.state.username, password: this.state.password, locationID: this.state.locationID });
                        }
                    }
                }
                else {
                    this.props.navigation.navigate('SearchName', { users: users, keyword: this.state.identifier, username: this.state.username, password: this.state.password, locationID: this.state.locationID });
                    this.setState({ identifier: '' });
                }
            }
            this.setState({ isLoading: false });
        })
        .catch((error) => {
            this.setState({ isLoading: false });
        });
    }

    rightArrowTapped(){
        if (this.state.currentPage == 2){
            this.setState({ addRightArrow: false});
            return;
        }
        //this.setState({ currentPage: this.state.currentPage + 1});
        this.state.currentPage++;
        this.setState({ addLeftArrow: true});

    }

    leftArrowTapped() {
        if(this.state.currentPage == 0){
            this.setState({ addLeftArrow: false});
            return;
        }
        this.state.currentPage--;
        this.setState({ addRightArrow: true});
    }
    searchButtonTapped() {
        if(this.state.identifier1 == ""){
            alert("Please input rego or last name.");
            return;
        }
        this.setState({ isLoading: true });
        lookupIdentifier(this.state.identifier1, this.state.username, this.state.password).then( response => {

            /*if(response.result != "success"){
                alert("You do not have permissions.");
                this.setState({ isLoading: false });
                return;
            }*/
            if (response.result === false) {
                this.setState({ addNewVisible: true, error: response.message });
            }
            else {
                let users = [];
                let tempKey = 0;
                for ( ; ; tempKey += 1) {
                    if (response.users[`${tempKey}`] !== undefined) {
                        users.push(response.users[`${tempKey}`]);
                    }
                    else {
                        break;
                    }
                }
                this.setState({ addNewVisible: false, selectedField: 0 })

                if (users[0].washcodes.length >= 1)
                    this.state.userstate1 = 0;
                else 
                    this.state.userstate1 = 1;

                if (users.length === 1 ) {
                    if (users[0].vehicleRegistrations.length === 1)
                    {
                        this.setState({ identifier1: '' });
                        this.props.navigation.navigate('Dashboard', { user: users[0], regoNumber: 0, userstate: this.state.userstate1, username: this.state.username, password: this.state.password, locationID: this.state.locationID });
                    }
                    else {
                        let i = 0;
                        for ( i = 0; i < users[0].vehicleRegistrations.length; i += 1) {
                        if (users[0].vehicleRegistrations[i].registrationNumber === this.state.identifier1) {
                            break;
                        }
                        }
                        if (i === users[0].vehicleRegistrations.length) {
                        this.props.navigation.navigate('SearchName', { users: users, keyword: this.state.identifier1, username: this.state.username, password: this.state.password, locationID: this.state.locationID });
                        this.setState({ identifier1: '' });
                        
                        }
                        else {
                        this.setState({ identifier1: '' });
                        this.props.navigation.navigate('Dashboard', { user: users[0], regoNumber: i, userstate: this.state.userstate1, username: this.state.username, password: this.state.password, locationID: this.state.locationID });
                        }
                    }
                }
                else {
                    this.props.navigation.navigate('SearchName', { users: users, keyword: this.state.identifier1, username: this.state.username, password: this.state.password, locationID: this.state.locationID });
                    this.setState({ identifier1: '' });
                }
            }
            this.setState({ isLoading: false });
        })
        .catch((error) => {
            this.setState({ isLoading: false });
        });
        // 
    }

    addNewRego() {
        if (this.state.identifier === '') {
            alert('Please input rego');
            return;
        }
        this.setState({ isLoading: true });
        let param = '';
        if (this.state.email.length > 0) {
            param = `${this.state.email},${this.state.identifier},${this.state.firstName},${this.state.lastName}`;
        }
        else {
            param = this.state.identifier;
        }
        addRego(param, this.state.username, this.state.password).then( response => {

            if (response.result === true) {
                lookupIdentifier(this.state.identifier, this.state.username, this.state.password).then( response => {

                    this.setState({ isLoading: false });
                    if (response.result === false) {
                        alert(response.message);
                    }
                    else {
                        let users = [];
                        for (let tempKey = 0; ; tempKey += 1) {
                            if (response.users[`${tempKey}`] !== undefined) {
                                users.push(response.users[`${tempKey}`]);
                            } else {
                                break;
                            }
                        }
                        this.setState({ addNewVisible: false, selectedField: 0 })

                        if (users[0].washcodes.length >= 1)
                            this.state.userstate1 = 0;
                        else 
                            this.state.userstate1 = 1;

                        if (users.length === 1 ) {
                            if (users[0].vehicleRegistrations.length === 1)
                            {
                                this.setState({ identifier: '' });
                                this.props.navigation.navigate('Dashboard', { user: users[0], regoNumber: 0, userstate: this.state.userstate1, username: this.state.username, password: this.state.password, locationID: this.state.locationID });
                            }
                            else {
                                let i = 0;
                                for ( i = 0; i < users[0].vehicleRegistrations.length; i += 1) {
                                    if (users[0].vehicleRegistrations[i].registrationNumber === this.state.identifier) {
                                        break;
                                    }
                                }
                                
                                if (i === users[0].vehicleRegistrations.length) {
                                    this.props.navigation.navigate('SearchName', { users: users, keyword: this.state.identifier, username: this.state.username, password: this.state.password, locationID: this.state.locationID });
                                }
                                else {
                                    this.props.navigation.navigate('Dashboard', { user: users[0], regoNumber: i, userstate: this.state.userstate1, username: this.state.username, password: this.state.password, locationID: this.state.locationID });
                                }
                                this.setState({ identifier: '' });
                            }
                        }
                        else {
                            this.props.navigation.navigate('SearchName', { users: users, keyword: this.state.identifier, username: this.state.username, password: this.state.password, locationID: this.state.locationID });
                            this.setState({ identifier: '' });
                        }
                    }
                })
                .catch((error) => {
                    this.setState({ isLoading: false });
                });
            }
            else {
                this.setState({ isLoading: false });
                alert(response.message);
            }
        })
        .catch((error) => {
            this.setState({ isLoading: false });
        });
    }

    render() {
        return (
            <View style={{ backgroundColor: 'white' }}>
                <ScrollView style={{height: deviceWidth}}>
                    <View style={{height: deviceWidth}}>
                        <LogIn
                            loginButtonTapped={this.loginButtonTapped.bind(this)}
                            updateState={this.setState.bind(this)}
                            addRegoButtonTapped={this.addRegoButtonTapped.bind(this)}
                            searchButtonTapped = {this.searchButtonTapped.bind(this)}
                            rightArrowTapped = {this.rightArrowTapped.bind(this)}
                            leftArrowTapped = {this.leftArrowTapped.bind(this)}
                            {...this.state}
                            />
                        <View style={{ position: 'absolute', height: width(28), width: width(65), top: this.state.addNewVisible ? width(29) + 80 : width(21) + 30, left: width(17.5) }}>
                            <View style={{ height: width(6.5) - 9, marginTop: 10, flexDirection: 'row' }}>
                                <TouchableOpacity style={styles.numberButton} onPress={() => this.updateText( '1' )}>
                                    <Text style={{ textAlign: 'center', fontSize: 30 }}>1</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.numberButton} onPress={() => this.updateText( '2' )}>
                                    <Text style={{ textAlign: 'center', fontSize: 30 }}>2</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.numberButton} onPress={() => this.updateText( '3' )}>
                                    <Text style={{ textAlign: 'center', fontSize: 30 }}>3</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.numberButton} onPress={() => this.updateText( '4' )}>
                                    <Text style={{ textAlign: 'center', fontSize: 30 }}>4</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.numberButton} onPress={() => this.updateText( '5' )}>
                                    <Text style={{ textAlign: 'center', fontSize: 30 }}>5</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.numberButton} onPress={() => this.updateText( '6' )}>
                                    <Text style={{ textAlign: 'center', fontSize: 30 }}>6</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.numberButton} onPress={() => this.updateText( '7' )}>
                                    <Text style={{ textAlign: 'center', fontSize: 30 }}>7</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.numberButton} onPress={() => this.updateText( '8' )}>
                                    <Text style={{ textAlign: 'center', fontSize: 30 }}>8</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.numberButton} onPress={() => this.updateText( '9' )}>
                                    <Text style={{ textAlign: 'center', fontSize: 30 }}>9</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.numberButton, { marginRight: 0 }]} onPress={() => this.updateText( '0' )}>
                                    <Text style={{ textAlign: 'center', fontSize: 30 }}>0</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={{ height: width(6.5) - 9, marginTop: 10, flexDirection: 'row' }}>
                                <TouchableOpacity style={styles.numberButton} onPress={() => this.updateText( 'q' )}>
                                    <Text style={{ textAlign: 'center', fontSize: 30 }}>q</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.numberButton} onPress={() => this.updateText( 'w' )}>
                                    <Text style={{ textAlign: 'center', fontSize: 30 }}>w</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.numberButton} onPress={() => this.updateText( 'e' )}>
                                    <Text style={{ textAlign: 'center', fontSize: 30 }}>e</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.numberButton} onPress={() => this.updateText( 'r' )}>
                                    <Text style={{ textAlign: 'center', fontSize: 30 }}>r</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.numberButton} onPress={() => this.updateText( 't' )}>
                                    <Text style={{ textAlign: 'center', fontSize: 30 }}>t</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.numberButton} onPress={() => this.updateText( 'y' )}>
                                    <Text style={{ textAlign: 'center', fontSize: 30 }}>y</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.numberButton} onPress={() => this.updateText( 'u' )}>
                                    <Text style={{ textAlign: 'center', fontSize: 30 }}>u</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.numberButton} onPress={() => this.updateText( 'i' )}>
                                    <Text style={{ textAlign: 'center', fontSize: 30 }}>i</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.numberButton} onPress={() => this.updateText( 'o' )}>
                                    <Text style={{ textAlign: 'center', fontSize: 30 }}>o</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.numberButton, { marginRight: 0 }]} onPress={() => this.updateText( 'p' )}>
                                    <Text style={{ textAlign: 'center', fontSize: 30 }}>p</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={{ height: width(6.5) - 9, marginTop: 10, flexDirection: 'row' }}>
                                <TouchableOpacity style={[styles.numberButton, { marginLeft: 0.5 }]} onPress={() => this.updateText( 'a' )}>
                                    <Text style={{ textAlign: 'center', fontSize: 30 }}>a</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.numberButton} onPress={() => this.updateText( 's' )}>
                                    <Text style={{ textAlign: 'center', fontSize: 30 }}>s</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.numberButton} onPress={() => this.updateText( 'd' )}>
                                    <Text style={{ textAlign: 'center', fontSize: 30 }}>d</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.numberButton} onPress={() => this.updateText( 'f' )}>
                                    <Text style={{ textAlign: 'center', fontSize: 30 }}>f</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.numberButton} onPress={() => this.updateText( 'g' )}>
                                    <Text style={{ textAlign: 'center', fontSize: 30 }}>g</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.numberButton} onPress={() => this.updateText( 'h' )}>
                                    <Text style={{ textAlign: 'center', fontSize: 30 }}>h</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.numberButton} onPress={() => this.updateText( 'j' )}>
                                    <Text style={{ textAlign: 'center', fontSize: 30 }}>j</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.numberButton} onPress={() => this.updateText( 'k' )}>
                                    <Text style={{ textAlign: 'center', fontSize: 30 }}>k</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.numberButton} onPress={() => this.updateText( 'l' )}>
                                    <Text style={{ textAlign: 'center', fontSize: 30 }}>l</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.numberButton, { marginRight: 0.5 }]} onPress={() => this.updateText( '_' )}>
                                    <Text style={{ textAlign: 'center', fontSize: 30 }}>_</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={{ height: width(6.5) - 9, marginTop: 10, flexDirection: 'row' }}>
                                <TouchableOpacity style={styles.numberButton} onPress={() => this.updateText( '@' )}>
                                    <Text style={{ textAlign: 'center', fontSize: 30 }}>@</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.numberButton} onPress={() => this.updateText( 'z' )}>
                                    <Text style={{ textAlign: 'center', fontSize: 30 }}>z</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.numberButton} onPress={() => this.updateText( 'x' )}>
                                    <Text style={{ textAlign: 'center', fontSize: 30 }}>x</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.numberButton} onPress={() => this.updateText( 'c' )}>
                                    <Text style={{ textAlign: 'center', fontSize: 30 }}>c</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.numberButton} onPress={() => this.updateText( 'v' )}>
                                    <Text style={{ textAlign: 'center', fontSize: 30 }}>v</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.numberButton} onPress={() => this.updateText( 'b' )}>
                                    <Text style={{ textAlign: 'center', fontSize: 30 }}>b</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.numberButton} onPress={() => this.updateText( 'n' )}>
                                    <Text style={{ textAlign: 'center', fontSize: 30 }}>n</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.numberButton} onPress={() => this.updateText( 'm' )}>
                                    <Text style={{ textAlign: 'center', fontSize: 30 }}>m</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.numberButton} onPress={() => this.updateText( '.' )}>
                                    <Text style={{ textAlign: 'center', fontSize: 30 }}>.</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.numberButton, { marginRight: 0 }]} onPress={() => this.updateText('back')}>
                                    <Image  source={images.backspaceImage} style={{ width: width(6.5) - 9, height: width(6.5) - 9 }} resizeMode="stretch"/>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </ScrollView>
                <Modal isVisible={this.state.regoNameLengthVisible} onBackdropPress={() => {this.setState({ regoNameLengthVisible: false })}} backdropOpacity={0}>
                    <View style={[styles.modalContainer, { height: width(25) }]}>
                        <View style={styles.modalContent}>
                            <View style={{ height: 15, justifyContent: 'center' }}>
                            </View>
                            <View style={{ flex: 1, padding: 20 }}>
                                <View style={{ flex: 1, justifyContent: 'center' }}>
                                <Text style={styles.textContent}>This rego is more than 6 charactes, Is this correct?</Text>
                                </View>
                                <View style={{ flex: 1, justifyContent: 'center', flexDirection: 'row' }}>
                                <View style={{ flex: 1, justifyContent: 'center' }}>
                                    <TouchableOpacity style={styles.button} onPress={() => {this.addRegoButtonTapped(true); this.setState({ regoNameLengthVisible: false })}}>
                                    <Text style={styles.textContent}>YES</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={{ flex: 1, justifyContent: 'center' }}>
                                    <TouchableOpacity style={styles.button} onPress={() => {this.setState({ regoNameLengthVisible: false })}}>
                                    <Text style={styles.textContent}>FIX</Text>
                                    </TouchableOpacity>
                                </View>
                                </View>
                            </View>
                        </View>
                    </View>
                </Modal>
                {this.state.isLoading === true ? <View style={{ position: 'absolute', width: width(100), height: height(100), backgroundColor: colors.transparent, left: 0, top: 0, justifyContent: 'center' }}>
                    <Spinner style={{ alignSelf: 'center' }} isVisible={this.state.isLoading} size={100} type="FadingCircleAlt" color={colors.textFieldBorderColor}/>
                    </View> : null}
            </View>
        );
    }
}

function mapStateToProps(state) {
    return {
        user: state.user
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(ActionCreators, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(LogInContainer);
