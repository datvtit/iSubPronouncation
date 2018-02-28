
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
import YouTube, { YouTubeStandaloneIOS, YouTubeStandaloneAndroid } from 'react-native-youtube';
import ConstantHelper from './ConstantHelper';
import XMLParser from 'react-native-xml2js';
import CryptoJS from 'crypto-js';
import BackgroundTimer from 'react-native-background-timer';

export default class App extends React.Component {

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
      videoList: [],
      videosIndex: 0,
      videoId: '',
      isSeek: false,

      captionList: [],
      curPosSub: 0,
      curSubtitle: '',

      isReady: false,
      status: null,
      quality: null,
      error: null,
      isPlaying: true,
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
      if (Platform.OS === 'android') {
        ToastAndroid.show('You must input word to search', ToastAndroid.SHORT);
      }
      this.setState({
        isLoading: false,
      });
    }
  }

  parseVideoFromUrl = () => {
    let url = ConstantHelper.PRONOUNCE_API + this.state.searchText
      .replace(/\'/g, '%27')
      .replace(/ /g, '+')
      + "/" + this.state.searchType;
    console.log("parseVideoFromUrl: " + url);

    fetch(url)
      .then((response) => {
        // console.log("DATVIT >> response: " + response.status);
        if (response.status === 200) {
          return response.text();
        }
        return '';
      })
      .then((responseData) => {
        this.processDataFromAPI(responseData);
      })
      .catch((error) => {
        console.error('GET DATA ERROR: ' + error);
        this.setState({
          isLoading: false,
        });
        if (Platform.OS === 'android') {
          ToastAndroid.show('Sorry :(  There is no result for ' + this.state.searchText, ToastAndroid.SHORT);
        }
      });
  }

  // processData = (text) => {
  //   try {
  //     if (typeof text !== 'undefined' && text !== 'undefined' && text !== '') {
  //       // console.log("DATVIT >> parseVideoFromUrl_TEXT: " + text);

  //       if (text === '') {
  //         this.setState({
  //           isLoading: false,
  //         });
  //         if (Platform.OS === 'android') {
  //           ToastAndroid.show('Sorry :(  There is no result for ' + this.state.searchText, ToastAndroid.SHORT);
  //         }
  //       } else {
  //         let option = {
  //           lowerCaseTagName: true,
  //           script: true,
  //           style: false,
  //           pre: false
  //         };
  //         let root = HTMLParser.parse(text, option);
  //         let script = root.querySelector('#kq');

  //         if (script && script.text) {
  //           let res = script.text;

  //           let data = this.encryptFun(res, ConstantHelper.KEY_CRYPT);
  //           let listVideo = JSON.parse(data);
  //           console.log("DATVIT >> listVideo: " + listVideo.length);

  //           if (listVideo.length > 0) {
  //             let arrVideo = [];
  //             let idVideo = [];

  //             let size = Math.min(20, listVideo.length);

  //             for (let i = 0; i < size; i++) {
  //               let video = listVideo[i].toString();
  //               idVideo.push(video);
  //             }

  //             if (Array.isArray(idVideo) && idVideo.length > 0) {
  //               this.setState({
  //                 isLoading: false,
  //                 isSeek: false,

  //                 videoIdList: idVideo,
  //                 videosIndex: 0,
  //               }, () => {
  //                 this.checkSub(this.state.videoIdList[this.state.videosIndex]);
  //               });
  //             } else {
  //               this.setState({
  //                 isLoading: false,
  //               });
  //               if (Platform.OS === 'android') {
  //                 ToastAndroid.show('Sorry :(  There is no result for ' + this.state.searchText, ToastAndroid.SHORT);
  //               }
  //             }
  //           } else {
  //             this.setState({
  //               isLoading: false,
  //             });
  //             if (Platform.OS === 'android') {
  //               ToastAndroid.show('Sorry :(  There is no result for ' + this.state.searchText, ToastAndroid.SHORT);
  //             }
  //           }
  //         } else {
  //           this.setState({
  //             isLoading: false,
  //           });
  //           if (Platform.OS === 'android') {
  //             ToastAndroid.show('Sorry :(  There is no result for ' + this.state.searchText, ToastAndroid.SHORT);
  //           }
  //         }
  //       }
  //     } else {
  //       this.setState({
  //         isLoading: false,
  //       });
  //       if (Platform.OS === 'android') {
  //         ToastAndroid.show('Sorry :(  There is no result for ' + this.state.searchText, ToastAndroid.SHORT);
  //       }
  //     }
  //   } catch (error) {
  //     console.error('ERROR: ' + error);
  //     this.setState({
  //       isLoading: false,
  //     });
  //     if (Platform.OS === 'android') {
  //       ToastAndroid.show('Sorry :(  There is no result for ' + this.state.searchText, ToastAndroid.SHORT);
  //     }
  //   }
  // }

  // encryptFun = (data, key) => {
  //   let decrypted = CryptoJS.AES.decrypt(data, key);
  //   return decrypted.toString(CryptoJS.enc.Utf8);
  // }


  processDataFromAPI = (text) => {
    try {
      if (typeof text !== 'undefined' && text !== 'undefined' && text !== '') {
        if (text === '') {
          this.setState({
            isLoading: false,
          });
          if (Platform.OS === 'android') {
            ToastAndroid.show('Sorry :(  There is no result for ' + this.state.searchText, ToastAndroid.SHORT);
          }
        } else {
          if (text.search('params.jsonData')) {
            var res = text.substring(text.indexOf('total_results') - 3, text.indexOf('params.jsStart')).trim();
            res = res.replace(/\\\"/g, '"')
              .replace(/\\\\/g, '\\')
              .replace(/\\\"/g, "'")
              .replace(/\\\'/g, "'");
            res = res.substring(0, res.length - 2);
            // console.log("DATVIT >> JSON_DATA: " + res);
            let jsonData = JSON.parse(res);

            let arrVideo = [];

            jsonData['results'].map(video => {

              arrVideo.push({
                display: video.display,
                vid: video.vid,
                start: Number.parseFloat(video.start),
              });

            });

            if (Array.isArray(arrVideo) && arrVideo.length > 0) {
              this.setState({
                isLoading: false,
                isSeek: false,

                videoList: arrVideo,
                videosIndex: 0,
                videoId: arrVideo[0].vid,
              }, () => {
                this.checkSub(this.state.videoId);
              });
            } else {
              this.setState({
                isLoading: false,
              });
              if (Platform.OS === 'android') {
                ToastAndroid.show('Sorry :(  There is no result for ' + this.state.searchText, ToastAndroid.SHORT);
              }
            }
          } else {
            this.setState({
              isLoading: false,
            });
            if (Platform.OS === 'android') {
              ToastAndroid.show('Sorry :(  There is no result for ' + this.state.searchText, ToastAndroid.SHORT);
            }
          }
        }
      } else {
        this.setState({
          isLoading: false,
        });
        if (Platform.OS === 'android') {
          ToastAndroid.show('Sorry :(  There is no result for ' + this.state.searchText, ToastAndroid.SHORT);
        }
      }
    } catch (error) {
      console.error('ERROR: ' + error);
      this.setState({
        isLoading: false,
      });
      if (Platform.OS === 'android') {
        ToastAndroid.show('Sorry :(  There is no result for ' + this.state.searchText, ToastAndroid.SHORT);
      }
    }
  }

  showData = () => {
    // console.log("DATVIT >> showData");

    if (this.state.videoList.length > 0 && this.state.videoId !== '') {
      return (
        <View style={styles.containerContent}>
          <View style={styles.formInfo}>
            <Text
              style={[styles.textResult, { color: '#7F98AD' }]}>How to pronounce</Text>
            <Text
              style={[styles.textResult, { color: '#FFA500' }]}> '{this.state.searchText}' </Text>
            <Text
              style={[styles.textResult, { color: '#7F98AD' }]}>in English ({this.state.videosIndex + 1} out of {this.state.videoList.length}):</Text>
          </View>

          {this.state.containerMounted &&
            <YouTube
              ref={(component) => { this._youTubePlayer = component }}
              apiKey={ConstantHelper.YOUTUBE_API}
              videoId={this.state.videoId}
              play={this.state.isPlaying}
              loop={this.state.isLooping}
              fullscreen={this.state.fullscreen}
              controls={1}
              resumePlayAndroid={true}
              modestbranding={true}
              rel={false}
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
                  console.log('DATVIT >> isReady ' + this.state.isReady);
                  this.updateTime();
                });
              }}
              onChangeState={e => this.setState({
                status: e.state
              }, () => {
                console.log("DATVIT >> STATUS: " + this.state.status);
              })}
              onChangeQuality={e => this.setState({ quality: e.quality })}
              onError={e => this.setState({ error: e.error })}
              onChangeFullscreen={e => this.setState({ fullscreen: e.isFullscreen })}
              onProgress={e => this.setState({ duration: e.duration, currentTime: e.currentTime })}
            />
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
      } else if (this.state.searchText === '') {
        return (
          <View style={styles.containerContent}>
            <Text style={[styles.textDefault]}>Use YouTube to improve your English pronunciation. With more than 30M tracks, iSub gives you fast, unbiased answers about how English is spoken by real people and in context.
            </Text>

            <View style={{ marginTop: 10, justifyContent: 'center', flexDirection: 'row' }}>
              <Text style={[styles.textDefault, { color: '#8B98AD' }]}>Example:
            </Text>
              <View style={{ marginTop: 10, marginLeft: 10, justifyContent: 'center', flexDirection: 'row' }}>{this.initWordExample()}</View>
            </View>
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

  initWordExample = () => {
    let wordDemo = [];

    wordDemo.push(<TouchableOpacity key={0} onPress={() => { this.searchWord('amazing') }}>
      <Text
        style={[styles.textResult, { fontSize: 18, color: '#0000FF' }]}>amazing, </Text>
    </TouchableOpacity>);
    wordDemo.push(<TouchableOpacity key={1} onPress={() => { this.searchWord('love') }}>
      <Text
        style={[styles.textResult, { fontSize: 18, color: '#0000FF' }]}>love, </Text>
    </TouchableOpacity>);
    wordDemo.push(<TouchableOpacity key={2} onPress={() => { this.searchWord('i love you') }}>
      <Text
        style={[styles.textResult, { fontSize: 18, color: '#0000FF' }]}>i love you</Text>
    </TouchableOpacity>);

    return wordDemo;
  }

  updateTime = () => {
    // console.log("updateTime");
    // const timeUpdate = setInterval(() => {
    //   try {
    //     if ((this.state.duration > 10 && this.state.currentTime == this.state.duration)
    //       || this.state.isFinish === true) {
    //       return clearInterval(timeUpdate);
    //     }

    //     console.log("DATVIT >> CURRENT_TIME: " + this.state.currentTime);

    //     if (Platform.OS === 'android') {
    //       if (this._youTubePlayer && this.state.isReady && this.state.status === 'playing') {
    //         this._youTubePlayer
    //           .currentTime()
    //           .then(currentTime => this.setState({ currentTime }))
    //           .catch(errorMessage => {
    //             console.log('DATVIT >> updateTime: error: ' + errorMessage);
    //           });
    //         this._youTubePlayer
    //           .duration()
    //           .then(duration => this.setState({ duration }))
    //           .catch(errorMessage => {
    //             // this.setState({ error: errorMessage });
    //             console.log('DATVIT >> updateTime: error: ' + errorMessage);
    //           });
    //       }
    //     }
    //   } catch (err) {
    //   }

    //   try {
    //     console.log("TIME_UP: " + this.state.currentTime + " | " + this.state.duration);

    //     if (!this.state.isSeek) {
    //       this.setState({
    //         isSeek: true,
    //       }, () => {
    //         if (this.state.timeSeek) {
    //           console.log("SEEK_TO: " + Number.parseInt(this.state.timeSeek));
    //           this._youTubePlayer && this._youTubePlayer.seekTo(Number.parseInt(this.state.timeSeek));
    //         }
    //       });
    //     }

    //     if (this.state.status == 'playing' && this.state.isPlaying === false) {
    //       this.setState(() => {
    //         isPlaying: true
    //       });
    //     }

    //     if (this.state.captionList.length > 0 && this.state.isSeek) {

    //       for (let i = this.state.captionList.length - 1; i >= 0; i--) {
    //         // console.log("DATVIT >> CAP_TIME: " + this.state.captionList[i].timeStart);
    //         // console.log("DATVIT >> CAP_SUB: " + this.state.captionList[i].subText);
    //         if (this.state.captionList[i].timeStart <= this.state.currentTime + 2.5) {
    //           if (this.state.curPosSub !== i) {
    //             this.setState({
    //               curPosSub: i,
    //             });
    //           }
    //           if (this.state.status === 'playing' && this.state.curPosSub !== -1) {
    //             let caption = this.state.captionList[this.state.curPosSub].subText;
    //             // console.log("DATVIT >> caption: " + caption);

    //             if (typeof caption === 'string' && caption !== 'undefined' && caption.length > 0) {
    //               this.setState({
    //                 curSubtitle: caption
    //               });
    //             }
    //             break;
    //           }
    //         }
    //       }
    //     }
    //   } catch (error) {
    //     console.log("DATVIT >> ERROR: " + error);
    //   }
    // }, 1000);

    BackgroundTimer.runBackgroundTimer(() => {
      try {
        if ((this.state.duration > 10 && this.state.currentTime == this.state.duration)
          || this.state.isFinish === true) {
          BackgroundTimer.stopBackgroundTimer();
        }

        console.log("DATVIT >> CURRENT_TIME: " + this.state.currentTime);

        if (Platform.OS === 'android') {
          if (this._youTubePlayer && this.state.isReady && this.state.status === 'playing') {
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
        }
      } catch (err) {
      }

      try {
        console.log("TIME_UP: " + this.state.currentTime + " | " + this.state.duration);

        if (!this.state.isSeek) {
          this.setState({
            isSeek: true,
          }, () => {
            if (this.state.timeSeek) {
              console.log("SEEK_TO: " + Number.parseInt(this.state.timeSeek));
              this._youTubePlayer && this._youTubePlayer.seekTo(Number.parseInt(this.state.timeSeek));
            }
          });
        }

        if (this.state.status == 'playing' && this.state.isPlaying === false) {
          this.setState(() => {
            isPlaying: true
          });
        }

        if (this.state.captionList.length > 0 && this.state.isSeek && this.state.status === 'playing') {

          for (let i = this.state.captionList.length - 1; i >= 0; i--) {
            // console.log("DATVIT >> CAP_TIME: " + this.state.captionList[i].timeStart);
            // console.log("DATVIT >> CAP_SUB: " + this.state.captionList[i].subText);
            if (this.state.captionList[i].timeStart <= this.state.currentTime + 2.5) {
              if (this.state.curPosSub !== i) {
                this.setState({
                  curPosSub: i,
                });
              }
              if (this.state.curPosSub !== -1) {
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

  selectPronounce = (pronouce) => {
    console.log("DATVIT >> selectPronounce: " + pronouce);
    if (this.state.searchText !== '' && typeof this.state.searchText === 'string') {
      this.setState({
        isLoading: true,
        searchType: pronouce,

        videoIdList: [],
        videoList: [],
        videosIndex: 0,
        isSeek: false,

        captionList: [],
        curPosSub: 0,
        curSubtitle: '',

        isReady: false,
        status: null,
        quality: null,
        error: null,
        isPlaying: true,
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

  setPronounce = (type, pos) => {
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

  checkSub = (id) => {
    // console.log("DATVIT >> checkSub: " + this.state.videosIndex);
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
              this.getSub(id, name, lang);
            }
          });
        });
      }).catch((err) => {
        console.log('CHECK_SUB_YOUTUBE_API >> ERROR', err);
      })
  }

  getSub = (id, name, lang) => {
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

          timeSeek = this.state.videoList[this.state.videosIndex].start;
          caption = this.state.videoList[this.state.videosIndex].display;

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

            // if (timeSeek === -1) {
            //   if (this.state.searchText !== '' && this.state.searchText.trim().search(' ') !== -1) {
            //     if (subTemp.search(this.state.searchText.toLowerCase()) !== -1) {
            //       caption = text;
            //       timeSeek = Number.parseFloat(start);
            //       mark = index;

            //       console.log("DATVIT >> SEEK_TO_SUB_1: " + caption + " | " + timeSeek + " | " + mark);

            //     }
            //   } else {
            //     let subList = subTemp.split(' ');

            //     for (let i = 0; i < subList.length; i++) {
            //       if (subList[i].trim().replace(/\"/g, '')
            //         .replace(/\'/g, '')
            //         .replace(/\-/g, '')
            //         .replace(/\./g, '')
            //         .replace(/\,/g, '')
            //         .replace(/\!/g, '')
            //         .toLowerCase() === this.state.searchText.trim().toLowerCase()) {
            //         caption = text;
            //         timeSeek = Number.parseFloat(start);
            //         mark = index;

            //         console.log("DATVIT >> SEEK_TO_SUB_2: " + caption + " | " + timeSeek + " | " + mark);
            //         break;
            //       }
            //     }
            //   }
            // }
          });

          this.setSubtitle(caption, capList, timeSeek, mark);
        });
      }).catch((err) => {
        // console.log('GET_SUB_YOUTUBE_API >> ERROR', err);
      })
  }

  setSubtitle = (caption, capList, timeSeek, mark) => {
    // console.log("DATVIT >>  setSubtitle");
    this.setState({
      curSubtitle: caption,
      captionList: capList,
      curPosSub: mark,
      isSeek: false,
      timeSeek: timeSeek,
    }, () => {
      // this.seekPosition(timeSeek);
    });
  }

  updateSubtitle = () => {
    // console.log("DATVIT >>  updateSubtitle");
    const capUpdate = setInterval(() => {
      try {

        console.log("TIME_UP: " + this.state.currentTime + " | " + this.state.duration);

        if (!this.state.isSeek) {
          this.setState({
            isSeek: true,
          }, () => {
            if (this.state.timeSeek) {
              console.log("SEEK_TO: " + Number.parseInt(this.state.timeSeek));
              this._youTubePlayer && this._youTubePlayer.seekTo(Number.parseInt(this.state.timeSeek));
            }
          });
        }

        // if (this.state.status == 'playing' && this.state.isPlaying === false) {
        //   this.setState(() => {
        //     isPlaying: true
        //   });
        // }

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
      if (this.state.curSubtitle && this.state.curSubtitle !== '' && this.state.curSubtitle !== 'Loading . . .') {
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
    if (this.state.videosIndex < this.state.videoList.length - 1) {
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
      isPlaying: true,
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
      this.checkSub(this.state.videoId);
    })
  }

  togglePlay = () => {
    this.setState(s => ({
      isPlaying: !s.isPlaying
    }));

    if (this.state.status === 'playing') {
      if (Platform.OS === 'android') {
        ToastAndroid.show('Video paused', ToastAndroid.SHORT);
      }
      // this.setState({
      //   isPlaying: false,
      // }, () => {
      //   if (Platform.OS === 'android') {
      //     ToastAndroid.show('Video paused', ToastAndroid.SHORT);
      //   }
      // })
    } else {
      if (Platform.OS === 'android') {
        ToastAndroid.show('Video continue', ToastAndroid.SHORT);
      }
      // this.setState({
      //   isPlaying: true,
      // }, () => {
      //   if (Platform.OS === 'android') {
      //     ToastAndroid.show('Video continue', ToastAndroid.SHORT);
      //   }
      // })
    }
  }

  nextVideo = () => {
    if (this.state.videosIndex < this.state.videoList.length - 1) {
      this.setState({
        isLoading: true,
        isSeek: false,
        isPlaying: true,
        curSubtitle: '',
        videosIndex: this.state.videosIndex + 1,
        videoId: this.state.videoList[this.state.videosIndex + 1].vid,
        curPosSub: 0,
        captionList: [],
        duration: 0,
        currentTime: 0
      }, () => {
        this.checkSub(this.state.videoId);
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
        isPlaying: true,
        curSubtitle: '',
        videosIndex: this.state.videosIndex - 1,
        videoId: this.state.videoList[this.state.videosIndex - 1].vid,
        curPosSub: 0,
        captionList: [],
        duration: 0,
        currentTime: 0
      }, () => {
        this.checkSub(this.state.videoId);
      })
    } else {
      if (Platform.OS === 'android') {
        ToastAndroid.show('This is the first video', ToastAndroid.SHORT);
      }
    }
  }

  handleConnectionChange = (isConnected) => {
    this.setState({
      isWifi: isConnected
    });
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
                  placeholder='Enter words to find pronunciation'
                  underlineColorAndroid='transparent'
                  autoCapitalize='none'
                  autoCorrect={false}
                  style={{ backgroundColor: 'transparent' }}
                  onChangeText={(textEntry) => {
                    this.setState({
                      textSearch: textEntry,
                    });
                  }}
                  value={this.state.searchText}
                  onSubmitEditing={() => {
                    this.searchWord(this.state.textSearch);
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <ButtonSearch onPress={() => {
                   this.searchWord(this.state.textSearch);
                }}>
                  <Image source={require('./images/searchIcon.png')} style={{
                    width: (Platform.OS === 'ios') ? 20 : 60,
                    height: (Platform.OS === 'ios') ? 20 : 60,
                    marginTop: (Platform.OS === 'ios') ? 3 : 0,
                  }} />
                </ButtonSearch>
              </View>
            </View>

            <View style={styles.formType}>

              <TouchableHighlight onPress={() => { this.selectPronounce('all') }}>
                {this.setPronounce('all', 0)}
              </TouchableHighlight>

              <TouchableHighlight onPress={() => { this.selectPronounce('us') }}>
                {this.setPronounce('us', 2)}
              </TouchableHighlight>

              <TouchableHighlight onPress={() => { this.selectPronounce('uk') }}>
                {this.setPronounce('uk', 2)}
              </TouchableHighlight>

              <TouchableHighlight onPress={() => { this.selectPronounce('aus') }}>
                {this.setPronounce('aus', 1)}
              </TouchableHighlight>

            </View>

          </View>

          {this.showData()}
        </View >
      </ScrollView>
    );
  }

  componentDidMount() {
    NetInfo.isConnected.addEventListener('connectionChange', this.handleConnectionChange);

    NetInfo.isConnected.fetch().done(
      (isConnected) => { this.setState({ isWifi: isConnected }); }
    );
  }

  componentWillUnmount() {
    NetInfo.isConnected.removeEventListenesr('connectionChange', this.handleConnectionChange);
  }

  searchWord = (word) => {
    this.setState({
      isLoading: true,
      searchText: word,
      textSearch: word,

      videoIdList: [],
      videoList: [],
      videosIndex: 0,
      videoId: '',
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
    }, () => {
      if (this.state.isWifi === false) {
        this.setState({
          isLoading: false,
        });
        if (Platform.OS === 'android') {
          ToastAndroid.show('Not connection internet. Please check connection', ToastAndroid.SHORT);
        }
      } else {
        this.fetchDataFromUrl();
      }
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
    padding: 3,
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
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: (Platform.OS === 'ios') ? 2 : 1,
    borderColor: '#888',
    borderRadius: 5,
    backgroundColor: '#fff',
    height: 40,
  },

  inputSearch: {
    height: 40,
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
    margin: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    width: 200,
    height: 35,
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
    borderWidth: (Platform.OS === 'ios') ? 2 : 1,
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

  textDefault: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    justifyContent: 'center',
    textAlign: 'left',
    textAlignVertical: "center",
  },
});
