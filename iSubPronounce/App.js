
import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableHighlight,
  ActivityIndicator,
  TextInput,
  Dimensions,
  Animated,
  Image,
  Button,
  TouchableOpacity,
  PixelRatio,
  ToastAndroid,
  NetInfo,
} from 'react-native';

import HTMLParser from 'fast-html-parser';
import ButtonSearch from './ButtonSearch';
import Youtube from 'react-native-youtube';
import ConstantHelper from './ConstantHelper';
import XMLParser from 'react-native-xml2js';
import CryptoJS from 'crypto-js';

export default class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      isFinish: false,
      isWifi: false,

      textSearch: '',
      searchText: '',
      searchType: 'all',

      videoIdList: [],
      videosIndex: 0,
      isSeek: false,

      captionList: [],
      curPosSub: 0,
      curSubtitle: '',

      isReady: false,
      status: null,
      quality: null,
      error: null,
      isPlaying: false,
      isLooping: true,
      duration: 0,
      currentTime: 0,
      fullscreen: false,
      containerMounted: false,
      containerWidth: null,
    }
  }

  /**
   *  Get Data From URL
   */
  fetchDataFromUrl = () => {
    console.log("fetchDataFromUrl");
    if (this.state.searchText !== '' && typeof this.state.searchText === "string" &&
      this.state.searchType !== '' && typeof this.state.searchType === "string") {
      this.parseVideoFromUrl();
    } else {
      ToastAndroid.show('You must input word to search', ToastAndroid.SHORT);
      this.setState({
        isLoading: false,
      });
    }
  }

  parseVideoFromUrl = () => {
    console.log("parseVideoFromUrl");
    fetch(ConstantHelper.PRONOUNCE_API_V2 + this.state.searchText)
      .then((response) => {
        if (response.status === 200) {
          return response.text();
        }
        return '';
      }).then((text) => {
        try {
          if (typeof text !== 'undefined' && text !== 'undefined' && text !== '') {
            // console.log("DATVIT >> parseVideoFromUrl_TEXT: " + text);

            if (text === '') {
              this.setState({
                isLoading: false,
              });
              if (Platform.OS === 'android') {
                ToastAndroid.show('Sorry :(  There is no result for ' + this.state.searchText, ToastAndroid.SHORT);
              }
            } else {
              let option = {
                lowerCaseTagName: true,
                script: true,
                style: false,
                pre: false
              };
              let root = HTMLParser.parse(text, option);
              let script = root.querySelector('#kq');
              if (script !== 'undefined') {
                let res = script.text;

                // console.log("DATVIT >> RES: " + res);

                let data = this.encryptFun(res, ConstantHelper.KEY_CRYPT);
                let listVideo = JSON.parse(data);
                console.log("DATVIT >> videoList_LENGTH: " + listVideo.length);

                if (listVideo.length > 0) {
                  let arrVideo = [];
                  let idVideo = [];

                  let size = Math.min(20, listVideo.length);

                  for (let i = 0; i < size; i++) {
                    let video = listVideo[i].toString();
                    idVideo.push(video);
                  }

                  if (Array.isArray(idVideo) && idVideo.length > 0) {
                    this.setState({
                      isLoading: false,
                      isSeek: false,

                      videoIdList: idVideo,
                      videosIndex: 0,
                    }, () => {
                      this.checkSub(this.state.videoIdList[this.state.videosIndex]);
                    });
                  } else {
                    this.setState({
                      isLoading: false,
                    });
                  }
                } else {
                  this.setState({
                    isLoading: false,
                  });
                }
              } else {
                this.setState({
                  isLoading: false,
                });
              }
            }
          } else {
            this.setState({
              isLoading: false,
            });
          }
        } catch (error) {
          console.error('ERROR: ' + error);
          this.setState({
            isLoading: false,
          });
        }
      }).catch((error) => {
        console.error('GET DATA ERROR: ' + error);
        this.setState({
          isLoading: false,
        });
      });
  }

  showData = () => {
    console.log("showData");
    if (this.state.videoIdList.length > 0) {
      return (
        <View style={styles.containerContent}>
          <View style={styles.formInfo}>
            <Text
              style={[styles.textResult, { color: '#7F98AD' }]}>How to pronounce</Text>
            <Text
              style={[styles.textResult, { color: '#FFA500' }]}> '{this.state.searchText}' </Text>
            <Text
              style={[styles.textResult, { color: '#7F98AD' }]}>in English ({this.state.videosIndex + 1} out of {this.state.videoIdList.length}):</Text>
          </View>

          {this.state.containerMounted &&
            <Youtube
              ref={(component) => { this._youTubePlayer = component }}
              apiKey={ConstantHelper.YOUTUBE_API}
              // videoIds={this.state.videoIdList}
              videoId={this.state.videoIdList[this.state.videosIndex]}
              play={this.state.isPlaying}
              loop={this.state.isLooping}
              fullscreen={this.state.fullscreen}
              controls={2}
              modestbranding={true}
              style={[
                { height: PixelRatio.roundToNearestPixel(this.state.containerWidth / (16 / 9)) },
                styles.player,
              ]}
              onReady={e => {
                this.setState({
                  isReady: true,
                  isPlaying: true,
                  isSeek: false,
                  isFinish: false,
                }, () => {
                  console.log('DATVIT >> isReady: ' + this.state.isReady);
                  this.updateTime();
                  this.updateSubtitle();
                });
              }}
              onChangeState={e => this.setState({
                status: e.state
              }, () => {
                // console.log("DATVIT >> STATUS: " + this.state.status);
              }
              )}
              onChangeQuality={e => this.setState({ quality: e.quality })}
              onError={e => this.setState({ error: e.error })}
              onProgress={e => this.setState({
                currentTime: e.currentTime,
                duration: e.duration
              })}
            >
            </Youtube>
          }

          <View style={styles.formResult}>
            {this.formatSubtitle()}
          </View>

          <View style={styles.formControl}>
            <ButtonSearch onPress={() => this.previousVideo()} style={{ marginRight: (Platform.OS === 'ios') ? 40 : 30 }}>
              <Image source={this.setPreviousImage()} style={{ width: (Platform.OS === 'ios') ? 60 : 140, height: (Platform.OS === 'ios') ? 60 : 140 }} />
            </ButtonSearch>
            <ButtonSearch onPress={() => this.replayVideo()} style={{ marginRight: (Platform.OS === 'ios') ? 40 : 30 }}>
              <Image source={require('./images/replay.png')} style={{ width: (Platform.OS === 'ios') ? 40 : 120, height: (Platform.OS === 'ios') ? 40 : 120 }} />
            </ButtonSearch>
            <ButtonSearch onPress={() => this.togglePlay()} style={{ marginRight: (Platform.OS === 'ios') ? 40 : 30 }}>
              <Image source={this.setPlayPauseImage()} style={{ width: (Platform.OS === 'ios') ? 40 : 120, height: (Platform.OS === 'ios') ? 40 : 120 }} />
            </ButtonSearch>
            <ButtonSearch onPress={() => this.nextVideo()} >
              <Image source={this.setSkipImage()} style={{ width: (Platform.OS === 'ios') ? 60 : 140, height: (Platform.OS === 'ios') ? 60 : 140 }} />
            </ButtonSearch>
          </View>

        </View>
      );
    } else {
      if (this.state.isLoading) {
        return (
          <View style={styles.containerContent}>
            <ActivityIndicator size='large' color='#D62126' />
            <Text
              style={[styles.textResult]}>Please Wait . . </Text>
          </View>
        );
      } else {
        return (
          <View style={styles.containerContent}>
            <Text style={[styles.textResult]}>No result found</Text>
          </View>
        );
      }
    }
  }

  updateTime = () => {
    console.log("updateTime");
    if (Platform.OS === 'android') {
      const timeUpdate = setInterval(() => {
        try {
          if ((this.state.duration > 10 && this.state.currentTime == this.state.duration)
            || this.state.isFinish === true) {
            return clearInterval(timeUpdate);
          }

          // console.log("DATVIT >> CURRENT_TIME: " + this.state.currentTime);

          if (this._youTubePlayer && this.state.isReady) {
            this._youTubePlayer
              .currentTime()
              .then(currentTime => this.setState({ currentTime }))
              .catch(errorMessage => {
                console.log('DATVIT >> updateTime: error: ' + errorMessage);
              });
            this._youTubePlayer
              .duration()
              .then(duration => this.setState({ duration }))
              .catch(errorMessage => {
                // this.setState({ error: errorMessage });
                console.log('DATVIT >> updateTime: error: ' + errorMessage);
              });
          }
        } catch (err) {

        }

      }, 1000);
    }
  }

  selectPronounce(pronouce) {
    console.log("DATVIT >> selectPronounce");
    if (this.state.searchText !== '' && typeof this.state.searchText === 'string') {
      this.setState({
        isLoading: true,
        searchType: pronouce,

        videoList: [],
        videoIdList: [],
        videosIndex: 0,
        currentVideo: {
          id: '',
          position: -1,
          lanuage: '',
        },
        isSeek: false,

        captionList: [],
        curPosSub: -1,
        curSubtitle: '',

        isReady: false,
        status: null,
        quality: null,
        error: null,
        isPlaying: false,
        isLooping: true,
        duration: 0,
        currentTime: 0,
        fullscreen: false,
      }, () => {
        this.fetchDataFromUrl();
      });
    } else {
      this.setState({
        searchType: pronouce,
      });
    }
  }

  setPronounce(type, pos) {
    if (type === this.state.searchType) {
      if (pos === 0) {
        return (
          <View style={[styles.buttonStartType, { backgroundColor: '#E6E6E6', }]}>
            <Text style={styles.textSub}>
              {type.toUpperCase()}
            </Text>
          </View>
        );
      } else if (pos === 1) {
        return (
          <View style={[styles.buttonEndType, { backgroundColor: '#E6E6E6', }]}>
            <Text style={styles.textSub}>
              {type.toUpperCase()}
            </Text>
          </View>
        );
      }
      return (
        <View style={[styles.buttonType, { backgroundColor: '#E6E6E6', }]}>
          <Text style={styles.textSub}>
            {type.toUpperCase()}
          </Text>
        </View>
      );
    } else {
      if (pos === 0) {
        return (
          <View style={[styles.buttonStartType, { backgroundColor: '#fff', }]}>
            <Text style={styles.textSub}>
              {type.toUpperCase()}
            </Text>
          </View>
        );
      } else if (pos === 1) {
        return (
          <View style={[styles.buttonEndType, { backgroundColor: '#fff', }]}>
            <Text style={styles.textSub}>
              {type.toUpperCase()}
            </Text>
          </View>
        );
      }
      return (
        <View style={[styles.buttonType, { backgroundColor: '#fff', }]}>
          <Text style={styles.textSub}>
            {type.toUpperCase()}
          </Text>
        </View>
      );
    }
  }

  checkSub(id) {
    console.log("DATVIT >> checkSub: " + this.state.videosIndex);
    let link = ConstantHelper.CHECK_SUB_YOUTUBE_API + id;
    console.log('CHECK_SUB_YOUTUBE_API >> LINK', link);
    let parseString = XMLParser.parseString;

    fetch(link)
      .then(response => response.text())
      .then((response) => {
        parseString(response, (err, result) => {
          let tracks = result.transcript_list.track;
          tracks.map((track) => {
            let lang_default = track.$.lang_default;
            let lang = track.$.lang_code;
            let name = track.$.name;
            if (lang.search('en') > -1 && lang_default == 'true') {
              this.getSub.bind(this, id, name, lang);
            }
          });
        });
      }).catch((err) => {
        console.log('CHECK_SUB_YOUTUBE_API >> ERROR', err);
      })
  }

  getSub(id, name, lang) {
    let link = ConstantHelper.GET_SUB_YOUTUBE_API + id + '&lang=' + lang + '&name=' + name.replace(/&/g, "%26");
    let parseString = XMLParser.parseString;

    console.log('GET_SUB_YOUTUBE_API >> LINK', link);

    fetch(link)
      .then(response => response.text())
      .then((response) => {
        parseString(response, (err, result) => {
          let subList = result.transcript.text;
          var caption = '';
          var capList = [];
          var timeSeek = -1;
          var mark = 0;

          subList.map((sub, index) => {
            let text = sub._;
            let start = sub.$.start;

            capList.push({
              timeStart: Number.parseFloat(start),
              subText: text,
            });
            // Check sub seek to
            let subTemp = text
              .replace(/\n/g, ' ')
              .replace(/&#39;/g, "'")
              .replace(/&gt;/g, '')
              .replace(/&quot;/g, '"')
              .replace(/--/g, '').trim().toLowerCase();

            if (timeSeek === -1) {
              if (this.state.searchText !== '' && this.state.searchText.trim().search(' ') !== -1) {
                if (subTemp.search(this.state.searchText.toLowerCase()) !== -1) {
                  caption = text;
                  timeSeek = Number.parseFloat(start);
                  mark = index;

                  console.log("DATVIT >> SEEK_TO_SUB_1: " + caption + " | " + timeSeek + " | " + mark);

                }
              } else {
                let subList = subTemp.split(' ');

                for (let i = 0; i < subList.length; i++) {
                  if (subList[i].trim().replace(/\"/g, '')
                    .replace(/\'/g, '')
                    .replace(/\-/g, '')
                    .replace(/\./g, '')
                    .replace(/\,/g, '')
                    .replace(/\!/g, '')
                    .toLowerCase() === this.state.searchText.trim().toLowerCase()) {
                    caption = text;
                    timeSeek = Number.parseFloat(start);
                    mark = index;

                    console.log("DATVIT >> SEEK_TO_SUB_2: " + caption + " | " + timeSeek + " | " + mark);
                    break;
                  }
                }
              }
            }
          });

          this.setSubtitle.bind(this, caption, capList, timeSeek, mark);
        });
      }).catch((err) => {
        // console.log('GET_SUB_YOUTUBE_API >> ERROR', err);
      })
  }

  setSubtitle(text, capList, timeSeek, mark) {
    this.setState({
      curSubtitle: text,
      captionList: capList,
      curPosSub: mark,
      isSeek: false,
      isPlaying: true,
      timeSeek: timeSeek,
    }, () => {
      // this.seekPosition(timeSeek);
    });
  }

  updateSubtitle = () => {
    const capUpdate = setInterval(() => {
      try {

        console.log("TIME_UP: " + this.state.currentTime + " | " + this.state.duration);

        if (!this.state.isSeek) {
          this.setState({
            isSeek: true,
          }, () => {
            console.log("SEEK_TO: " + Number.parseInt(this.state.timeSeek));
            this._youTubePlayer && this._youTubePlayer.seekTo(Number.parseInt(this.state.timeSeek));
          });
        }

        if (this.state.status === 'playing' && this.state.isPlaying === false) {
          this.setState(() => {
            isPlaying: true
          });
        }

        if ((this.state.duration > 10 && this.state.currentTime == this.state.duration)
          || this.state.isFinish === true) {
          return clearInterval(capUpdate);
        }

        if (this.state.captionList.length > 0 && this.state.isSeek) {

          for (let i = this.state.captionList.length - 1; i >= 0; i--) {
            // console.log("DATVIT >> CAP_TIME: " + this.state.captionList[i].timeStart);
            // console.log("DATVIT >> CAP_SUB: " + this.state.captionList[i].subText);

            if (this.state.captionList[i].timeStart <= this.state.currentTime + 2.5) {

              if (this.state.curPosSub !== i) {
                this.setState({
                  curPosSub: i,
                });
              }
              if (this.state.status === 'playing' && this.state.curPosSub !== -1) {
                let caption = this.state.captionList[this.state.curPosSub].subText;
                // console.log("DATVIT >> caption: " + caption);

                if (typeof caption === 'string' && caption !== 'undefined' && caption.length > 0) {
                  this.setState({
                    curSubtitle: caption
                  });
                }
                break;
              }
            }
          }
        }
      } catch (error) {
        console.log("DATVIT >> ERROR: " + error);
      }
    }, 1000);
  }

  formatSubtitle = () => {
    // console.log("DATVIT >>  formatSubtitle");
    let capNew = [];

    if (this.state.captionList.length > 0 && this.state.isSeek) {
      if (this.state.curSubtitle !== '' && this.state.curSubtitle !== 'Loading . . .') {
        let subNew = this.state.curSubtitle
          .replace(/\n/g, ' ')
          .replace(/&#39;/g, "'")
          .replace(/&gt;/g, '')
          .replace(/&quot;/g, '"')
          .replace(/--/g, '').trim();

        // console.log("DATVIT >> subNew: " + subNew);

        if (this.state.searchText !== '' && this.state.searchText.trim().search(' ') !== -1) {
          let textSearch = this.state.searchText.toLowerCase().trim();
          let curSubtitle = subNew.toLowerCase().trim();
          let start = curSubtitle.search(textSearch);

          if (start !== -1) {
            let capStart = subNew.substring(0, start);
            let capMiddle = subNew.substring(start, start + textSearch.length);
            let capEnd = subNew.substring(start + textSearch.length);

            // console.log("DATVIT >> capStart: " + capStart + " | capMiddle: " + capMiddle + " | capEnd: " + capEnd);

            capNew.push(<Text key={0}
              style={[styles.textResult, { fontSize: 18, color: '#6495BF' }]}>{capStart}</Text>);
            capNew.push(<Text key={1}
              style={[styles.textResult, { fontSize: 18, color: '#6495BF', backgroundColor: '#FFFF00' }]}>{capMiddle}</Text>);
            capNew.push(<Text key={2}
              style={[styles.textResult, { fontSize: 18, color: '#6495BF' }]}>{capEnd}</Text>);

          } else {
            capNew.push(<Text key={0}
              style={[styles.textResult, { fontSize: 18, color: '#6495BF' }]}>{subNew}</Text>);
          }

        } else {
          let cap = subNew.split(' ');

          capNew = cap.map((x, i) => {
            if (x.trim().replace(/\"/g, '')
              .replace(/\'/g, '')
              .replace(/\-/g, '')
              .replace(/\./g, '')
              .replace(/\,/g, '')
              .replace(/\!/g, '')
              .toLowerCase() === this.state.searchText.trim().toLowerCase()) {
              return (
                <TouchableOpacity key={i}>
                  <Text
                    style={[styles.textResult, { fontSize: 18, color: '#6495BF', backgroundColor: '#FFFF00' }]}> {x} </Text>
                </TouchableOpacity>
              );
            } else {
              return (
                <TouchableOpacity key={i}>
                  <Text
                    style={[styles.textResult, { fontSize: 18, color: '#6495BF' }]}>{x} </Text>
                </TouchableOpacity>
              );
            }
          })
        }
      } else {
        capNew.push(<Text key={0}
          style={[styles.textResult, { fontSize: 18, color: '#6495BF' }]}>{this.state.curSubtitle}</Text>);
      }
    } else {
      capNew.push(<Text key={0}
        style={[styles.textResult, { fontSize: 18, color: '#6495BF' }]}>No found subtitle</Text>);
    }

    return capNew;
  }

  setPreviousImage = () => {
    if (this.state.videosIndex > 0) {
      return (
        require('./images/previous.png')
      );
    }
    return (
      require('./images/previousHide.png')
    );
  }

  setSkipImage = () => {
    if (this.state.videosIndex < this.state.videoIdList.length - 1) {
      return (
        require('./images/skip.png')
      );
    }
    return (
      require('./images/skipHide.png')
    );
  }

  setPlayPauseImage = () => {
    if (this.state.status === 'playing') {
      return (
        require('./images/pause.png')
      );
    }
    return (
      require('./images/play.png')
    );
  }

  replayVideo = () => {
    this.setState({
      isLoading: true,
      isSeek: false,
      isPlaying: false,
      curSubtitle: '',
      videosIndex: this.state.videosIndex,
      curPosSub: 0,
      captionList: [],
      duration: 0,
      currentTime: 0
    }, () => {
      if (Platform.OS === 'android') {
        ToastAndroid.show('Replay video', ToastAndroid.SHORT);
      }
      this.checkSub(this.state.videoIdList[this.state.videosIndex]);
    })
  }

  togglePlay = () => {
    if (this.state.status === 'playing') {
      this.setState({
        isPlaying: false,
      }, () => {
        ToastAndroid.show('Video paused', ToastAndroid.SHORT);
      })
    } else {
      this.setState({
        isPlaying: true,
      }, () => {
        ToastAndroid.show('Video continue', ToastAndroid.SHORT);
      })
    }
  }

  nextVideo = () => {
    if (this.state.videosIndex < this.state.videoIdList.length - 1) {
      this.setState({
        isLoading: true,
        isSeek: false,
        isPlaying: false,
        curSubtitle: '',
        videosIndex: this.state.videosIndex + 1,
        curPosSub: 0,
        captionList: [],
        duration: 0,
        currentTime: 0
      }, () => {
        this.checkSub(this.state.videoIdList[this.state.videosIndex]);
      })
    } else {
      if (Platform.OS === 'android') {
        ToastAndroid.show('This is the last video', ToastAndroid.SHORT);
      }
    }
  }

  previousVideo = () => {
    if (this.state.videosIndex > 0) {
      this.setState({
        isLoading: true,
        isSeek: false,
        isPlaying: false,
        curSubtitle: '',
        videosIndex: this.state.videosIndex - 1,
        curPosSub: 0,
        captionList: [],
        duration: 0,
        currentTime: 0
      }, () => {
        this.checkSub(this.state.videoIdList[this.state.videosIndex]);
      })
    } else {
      if (Platform.OS === 'android') {
        ToastAndroid.show('This is the first video', ToastAndroid.SHORT);
      }
    }
  }

  encryptFun = (data, key) => {
    // let keyParse = CryptoJS.enc.Latin1.parse(key);
    // let iv = CryptoJS.enc.Latin1.parse(key);
    // let encrypted = CryptoJS.AES.encrypt(
    //   data,
    //   keyParse,
    //   {
    //     iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.ZeroPadding
    //   });
    // console.log('encrypted: ' + encrypted);
    // let decrypted = CryptoJS.AES.decrypt(encrypted, key, { iv: iv, padding: CryptoJS.pad.ZeroPadding });
    let decrypted = CryptoJS.AES.decrypt(data, key);
    // console.log('DATVIT >> DECRYPTED: ' + decrypted.toString(CryptoJS.enc.Utf8));

    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  render() {
    return (
      <ScrollView
        style={styles.container}
        onLayout={({ nativeEvent: { layout: { width } } }) => {
          if (!this.state.containerMounted)
            this.setState({ containerMounted: true });
          if (this.state.containerWidth !== width)
            this.setState({ containerWidth: width });
        }}
      >
        <View style={styles.container}>

          <View style={styles.containerHeader}>

            <View style={styles.formSearch}>
              <View style={{ flex: 9 }}>
                <TextInput
                  // multiline={true}
                  placeholder='Search for ...'
                  underlineColorAndroid='transparent'
                  autoCapitalize='none'
                  autoCorrect={false}
                  style={{ backgroundColor: 'transparent' }}
                  onChangeText={(textEntry) => {
                    this.setState({
                      textSearch: textEntry,
                    });
                  }}
                  onSubmitEditing={() => {
                    this.setState((preState => {
                      return ({
                        isLoading: true,
                        searchText: preState.textSearch,

                        videoIdList: [],
                        videosIndex: 0,
                        isSeek: false,

                        captionList: [],
                        curPosSub: 0,
                        curSubtitle: '',

                        isReady: false,
                        status: null,
                        quality: null,
                        error: null,
                        isPlaying: false,
                        isLooping: true,
                        duration: 0,
                        currentTime: 0,
                        fullscreen: false,
                      });
                    }), () => {
                      if (this.state.isWifi === false) {
                        this.setState({
                          isLoading: false,
                        });
                      } else {
                        if (Platform.OS === 'android') {
                          ToastAndroid.show('Not connection internet. Please check connection', ToastAndroid.SHORT);
                        }
                        this.fetchDataFromUrl();
                      }
                    });
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <ButtonSearch onPress={() => {
                  this.setState((preState => {
                    return ({
                      isLoading: true,
                      searchText: preState.textSearch,

                      videoIdList: [],
                      videosIndex: 0,
                      isSeek: false,

                      captionList: [],
                      curPosSub: 0,
                      curSubtitle: '',

                      isReady: false,
                      status: null,
                      quality: null,
                      error: null,
                      isPlaying: false,
                      isLooping: true,
                      duration: 0,
                      currentTime: 0,
                      fullscreen: false,
                    });
                  }), () => {
                    if (this.state.isWifi === false) {
                      this.setState({
                        isLoading: false,
                      });
                    } else {
                      if (Platform.OS === 'android') {
                        ToastAndroid.show('Not connection internet. Please check connection', ToastAndroid.SHORT);
                      }
                      this.fetchDataFromUrl();
                    }

                  });
                }}>
                  <Image source={require('./images/searchIcon.png')} style={{
                    width: (Platform.OS === 'ios') ? 20 : 60,
                    height: (Platform.OS === 'ios') ? 20 : 60,
                    marginTop: (Platform.OS === 'ios') ? 3 : 0,
                  }} />
                </ButtonSearch>
              </View>
            </View>

            {/* <View style={styles.formType}>

              <TouchableHighlight onPress={() => { this.selectPronounce('all') }}>
                {this.setPronounce('all', 0)}
              </TouchableHighlight>

              <TouchableHighlight onPress={() => { this.selectPronounce('ae') }}>
                {this.setPronounce('ae', 2)}
              </TouchableHighlight>

              <TouchableHighlight onPress={() => { this.selectPronounce('be') }}>
                {this.setPronounce('be', 2)}
              </TouchableHighlight>

              <TouchableHighlight onPress={() => { this.selectPronounce('ce') }}>
                {this.setPronounce('ce', 2)}
              </TouchableHighlight>

              <TouchableHighlight onPress={() => { this.selectPronounce('ne') }}>
                {this.setPronounce('ne', 1)}
              </TouchableHighlight>
            </View> */}

          </View>

          {this.showData()}

        </View >
      </ScrollView>
    );
  }

  componentDidMount() {
    NetInfo.isConnected.addEventListener('change', this.handleConnectionChange);

    NetInfo.isConnected.fetch().done(
      (isConnected) => { this.setState({ isWifi: isConnected }); }
    );
  }

  componentWillUnmount() {
    NetInfo.isConnected.removeEventListenesr('change', this.handleConnectionChange);
  }

  handleConnectionChange = (isConnected) => {
    this.setState({
      isWifi: isConnected
    });
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: (Platform.OS === 'ios') ? 20 : 0,
  },

  containerHeader: {
    backgroundColor: '#F5F5F5',
    borderRadius: 5,
    borderColor: '#E3E3E3',
    borderWidth: 1,
    margin: 5,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
    flex: .7
  },

  containerContent: {
    backgroundColor: '#fff',
    borderRadius: 5,
    borderColor: '#E3E3E3',
    borderWidth: 1,
    margin: 5,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 2
  },

  formSearch: {
    flexDirection: 'row',
    width: window.width,
    margin: 5,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#888',
    borderRadius: 5,
    backgroundColor: '#fff',
    height: 50,
  },

  inputSearch: {
    height: 50,
    fontSize: 15,
  },

  listItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
    paddingTop: 10,
    paddingBottom: 10,
    width: window.width
  },

  button: {
    alignItems: 'center',
    marginBottom: 10,
    marginHorizontal: 10,
    backgroundColor: '#2196F3'
  },

  buttonText: {
    padding: 20,
    color: '#fff'
  },

  textTitle: {
    color: 'red',
    fontSize: 30,
    margin: 10,
    textAlign: 'center',
    fontWeight: 'bold',
  },

  formType: {
    flexDirection: 'row',
    margin: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    width: 250,
    height: 40,
  },

  buttonType: {
    paddingBottom: 5,
    paddingTop: 5,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: '#888',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    width: 50,
    flex: 1,
  },

  buttonEndType: {
    paddingBottom: 5,
    paddingTop: 5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: '#888',
    borderBottomRightRadius: 5,
    borderTopRightRadius: 5,
    width: 50,
    flex: 1,
  },

  buttonStartType: {
    paddingBottom: 5,
    paddingTop: 5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#888',
    borderBottomLeftRadius: 5,
    borderTopLeftRadius: 5,
    width: 50,
    flex: 1,
  },

  textSub: {
    color: 'black',
    fontSize: 15,
    textAlign: 'center',
    fontWeight: 'bold',
  },

  textResult: {
    color: '#8B98AD',
    fontSize: 15,
    justifyContent: 'center',
    textAlign: 'center',
    textAlignVertical: "center",
  },

  formResult: {
    margin: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 5,
    borderColor: '#8B98AD',
    borderWidth: 1,
    padding: 10,
    flex: .5,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  formInfo: {
    margin: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    flex: .1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  formControl: {
    margin: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    flex: .3,
  },

  player: {
    alignSelf: 'stretch',
    flex: 2,
    backgroundColor: 'black',
    marginVertical: 10,
  },
});
