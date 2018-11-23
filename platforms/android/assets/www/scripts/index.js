// 如需空白範本的簡介，請參閱下列文件: 
// http://go.microsoft.com/fwlink/?LinkID=397704
// 若要針對在 Ripple 或 Android 裝置/模擬器上載入的頁面，偵錯程式碼: 請啟動您的應用程式，設定中斷點，
// 然後在 JavaScript 主控台中執行 "window.location.reload()"。
(function () {
    "use strict";

    document.addEventListener('deviceready', onDeviceReady.bind(this), false);

    //var ContentIndexCode = "2016-10-03-1(vCode=7)";
    //var ContentIndexCode = "2016-10-20-1(vCode=7)";
    //var ContentIndexCode = "2017-04-20-1(vCode=7)";
    //var ContentIndexCode = "2017-06-15-1(vCode=7)";
    //var ContentIndexCode = "2017-07-11-1(vCode=8)";
    //var ContentIndexCode = "2017-07-27-1(vCode=8)";
    //var ContentIndexCode = "2017-07-28-1(vCode=8)";
    //var ContentIndexCode = "2017-07-30-1(vCode=8)";
    //var ContentIndexCode = "2017-08-07-1(vCode=8)";
    //var ContentIndexCode = "2017-08-14-1(vCode=8)";
    //var ContentIndexCode = "2017-08-31-1(vCode=8)";
    //var ContentIndexCode = "2017-09-08-1(vCode=8)";
    //var ContentIndexCode = "2017-09-18-1(vCode=8)";
    var ContentIndexCode = "2017-10-02-1(vCode=8)";

    var DeviceId = "";//裝罝的UUID
    var PatientBedId = "16512";//預設綁定床號

    var PayStatus = 0;//0->未開通 1->試用中  2->試用結束 3->已開通 4->開通結束
    var ref = null;

    var BedIdTouchCount = 0;

    var remoteFiles = [];
    var downloadPromise;
    var CURRENT_DOWNLOAD_FILE = "";
    //var httpd = null;
    var ApplicationData = [];
    var ADContent;
    var ADData = [];
    var ADCount = 0;

    var InstallData;

    //每10秒檢查軟體設定
    var UpdateCount = 0;
    //跑馬燈計數器
    var MarqueeCount = 0;
    var MarqueeContent;

    //自己的相關資訊
    var batteryCount = 0;
    var batteryPlugin = false;

    var macAddress = "";
    var ipAddress = "";
    var apName = "";
    var currentStep = "BC-Content-Index";

    var debugMode = false;

    var NeedPayText = "";
    var DeviceLockText = "";

    var confirmIsShow = false;
    var alertIsShow = false;
    var isMarqueeFirstTime = true;

    var logOb;
    var tryLog;
    var RealUsingLog;

    var isModalShow = false;
    var LastFineWifi = "";
    var StaticWifi = false;//預設為false，方便demo時預設為true，true就不會偵測後台設定

    var myScroll1;
    var myScroll2;

    var accId = '';
    var charId = '';
    var patientFullName = '';

    /** 裝置Id功能 */
    var OSVersion = '';
    var myDeviceId = '';//機型Id
    /** 裝置Id功能 */

    var isUnlockShow = false;

    /*2017-07-28*/
    var emptyCounter = 0;

    /*2017-07-30*/
    /*點選App的紀錄*/
    var tapHistory = [];

    /*2018-03-05*/
    var currentClick = '';

    

    //---------------------------------------------------------------------------------------------------------------

    function CheckIsTryEnd() {
        /** 2017-04-20*/
        console.log("呼叫CheckIsTryEnd");
        /** 2017-04-20*/
        if (window.localStorage.TryDateTime) {
            var d1 = new Date();
            var d2 = new Date(window.localStorage.TryDateTime);
            if (d1.getTime() > d2.getTime()) {
                window.localStorage.removeItem('TryDateTime');
                PayStatus = 2;
                $('#PayState').text(ConvertPayStatus());
                UpdatePayStatus(2);
            }
        }
    }

    function CheckIsRealUsingEnd() {
        /** 2017-04-20*/
        console.log("呼叫CheckIsRealUsingEnd");
        /** 2017-04-20*/
        if (window.localStorage.RealUsingDateTime) {
            var d1 = new Date();
            var d2 = new Date(window.localStorage.RealUsingDateTime);
            if (d1.getTime() > d2.getTime()) {
                window.localStorage.removeItem('RealUsingDateTime');
                PayStatus = 4;
                $('#PayState').text(ConvertPayStatus());
                UpdatePayStatus(4);
            }
        }
    }


    function CheckIsBind() {
        /** 2017-04-20*/
        console.log("呼叫CheckIsBind");
        /** 2017-04-20*/
        if (window.localStorage.BedId) {
            //alert(window.localStorage.BedId);
            console.log("執行BindPatient by CheckIsBind(已綁):" + window.localStorage.BedId);
            PatientBedId = window.localStorage.BedId;
            BindPatientInformation(PatientBedId);
        } else {
            window.navigator.notification.prompt(
                            "病床尚未綁定，請輸入床號",
                            function (ClientAnswer) {
                                if (ClientAnswer.buttonIndex === 1) {
                                    var newCommand = ClientAnswer.input1;
                                    //ProcessClientCommand(newCommand);
                                    console.log("執行BindPatient by CheckIsBind(未綁):" + newCommand);
                                    window.localStorage.BedId = newCommand;
                                    BindPatientInformation(newCommand);
                                    //addBindLog(newCommand);
                                } else {
                                    //取消進入管理介面
                                    if (alertIsShow == false) {
                                        CustomAlert("未輸入床號，無法綁定");
                                    }
                                    navigator.app.exitApp();
                                }
                            },
                            "PT-Content",
                            ["確定", "取消"],
                            ""
                          );
        }
    };

    function WriteText(cBedId) {
        console.log("窵入床號" + cBedId);
        var path = cordova.file.externalRootDirectory;
        window.resolveLocalFileSystemURI(path, function (dir) {
            dir.getFile("bedlog.txt", { create: true }, function (file) {
                logOb = file;
                writeLog(cBedId);
            });
        }, function () { //fail
            console.log("窵入床號失敗");
        });
    }

    function writeLog(cData) {
        if (!logOb) return;
        var log = cData;

        logOb.createWriter(function (fileWriter) {
            //取消下行會改為append
            //fileWriter.seek(fileWriter.length);        
            var blob = new Blob([log], { type: 'text/plain' });
            fileWriter.write(blob);

        }, function () {
            console.log("寫入log失敗");
        });
    }

    function addBindLog(pPatientBedId) {
        $.ajax({
            url: "http://122.117.67.226:5388/BindLog.aspx",
            type: "get",
            data: { BedId: pPatientBedId, AndroidId: DeviceId, QueryAcc: accId, QueryChar: charId, QueryName: patientFullName },
            dataType: 'text',
            success: function (response) {
                if (response.trim() == "") {
                    if (alertIsShow == false) {
                        CustomAlert("無法寫入資料");
                    }
                } else {
                    if (response.trim() == "Complete") {
                        //寫入床號暫存檔
                        WriteText(pPatientBedId);
                    } else {
                        if (alertIsShow == false) {
                            CustomAlert("錯誤：" + response.trim());
                        }
                    }
                }
            },
            error: function (xhr) {
                if (alertIsShow == false) {
                    CustomAlert("addBindLog無法連線到伺服器");
                }
            }
        });
    }

    function onDeviceReady() {

        function successFunction() {
            console.log("It worked!");
        }

        function errorFunction(error) {
            console.log("456->" + error);
        }

        function trace(value) {
            console.log("123->" + value);
        }

        // Is this plugin supported?
        AndroidFullScreen.isSupported(successFunction, errorFunction);

        // Is immersive mode supported?
        AndroidFullScreen.isImmersiveModeSupported(successFunction, errorFunction);

        // The width of the screen in immersive mode
        AndroidFullScreen.immersiveWidth(trace, errorFunction);

        // The height of the screen in immersive mode
        AndroidFullScreen.immersiveHeight(trace, errorFunction);

        // Hide system UI until user interacts
        AndroidFullScreen.leanMode(successFunction, errorFunction);

        // Show system UI
        AndroidFullScreen.showSystemUI(successFunction, errorFunction);

        // Extend your app underneath the status bar (Android 4.4+ only)
        AndroidFullScreen.showUnderStatusBar(successFunction, errorFunction);

        // Extend your app underneath the system UI (Android 4.4+ only)
        AndroidFullScreen.showUnderSystemUI(successFunction, errorFunction);

        // Hide system UI and keep it hidden (Android 4.4+ only)
        AndroidFullScreen.immersiveMode(successFunction, errorFunction);

        // Custom full screen mode
        AndroidFullScreen.setSystemUiVisibility(AndroidFullScreen.SYSTEM_UI_FLAG_FULLSCREEN | AndroidFullScreen.SYSTEM_UI_FLAG_LOW_PROFILE, successFunction, errorFunction);

        /** 2017-04-20*/
        console.log("呼叫onDeviceReady");
        /** 2017-04-20*/

        myScroll1 = new iScroll('wrapper1', { hScroll: false, vScroll: false, hScrollbar: false, vScrollbar: false });
        myScroll2 = new iScroll('wrapper2', { hScroll: false, vScroll: false, hScrollbar: false, vScrollbar: false });

        window.plugins.launcher.launch({ packageName: 'com.bc.rightmenu' }, successCallback, errorCallback);
        window.plugins.uniqueDeviceID.get(GetUIdSuccess, GetUIdFail);

        ClearTableContent();

        // 處理 Cordova 暫停與繼續事件
        $('#Modal').hide();
        $('#ModalImage').hide();
        $('#ModalSpan').hide();
        isModalShow = false;

        $('#Modal').bind('click', function () {
            $('#Modal').hide();
            $('#ModalSpan').hide();
            $('#ModalImage').hide();
            isModalShow = false;
        });

        window.addEventListener("batterystatus", onBatteryStatus, false);
        document.addEventListener("offline", NetworkOffline, false);
        document.addEventListener("online", NetworkOnline, false);
        document.addEventListener('pause', onPause.bind(this), false);
        document.addEventListener('resume', onResume.bind(this), false);

        document.addEventListener("backbutton", function (e) {
            e.preventDefault();

            if (isModalShow == true) {
                $('#Modal').hide();
                $('#ModalImage').hide();
                $('#ModalSpan').hide();
                isModalShow = false;
                GoHome();
            }
        }, false);

        window.addEventListener("touchmove", function (e) {
            e.preventDefault();
        }, false);

        BindIconItem(1);
        BindIconItem(2);

        GetDeviceInfo();/** 裝置Id功能 */
        GetHospitalData();
        installedApps.getPackages(GetInstallListSuccess, GetInstallListFail);
        BindApplication();
        
        /* 2017-07-29 Testing Download APK And Install on Launcher */
        //PushDownloadFile("http://122.117.67.226:5388/Upload/sign5/2017-06-04-13-18-02.apk");
        //PushDownloadFile("http://122.117.67.226:5388/Upload/sign/2016-11-18-07-23-51.apk");
        //PushDownloadFile("http://122.117.67.226:5388/Upload/sign/youtubes.apk");
        //PushDownloadFile("http://122.117.67.226:5388/Upload/sign/qiyi.apk");
        //PushDownloadFile("http://122.117.67.226:5388/Upload/sign/LiTV.apk");

        setInterval(function () {
            UpdateCount++;
            /** 2017-04-20*/
            //console.log("計時器秒數:"+UpdateCount);
            /** 2017-04-20*/

            if (UpdateCount == 60) {
                UpdateCount = 0;
                DoCheckUpdate();
                //BindMarqueeText();

                //if (GetNetworkStatus() == true) {
                //    //60秒偵測網路
                //    if (StaticWifi == false) {
                //        GetWifiSetting();
                //    }
                //} else {
                //    ReConnectLastFineWifi();
                //}
            }

            if (UpdateCount == 20) {
                BindAdData();
                //window.plugins.launcher.launch({ packageName: 'bc.ptcontent' }, successCallback, errorCallback);
            }

            //每10秒回傳自己的狀態
            if (UpdateCount == 10) {
                WifiWizard.getCurrentSSID(ssidHandler, ssidFail);
                networkinterface.getIPAddress(function (ip) { ipAddress = ip; });
                //BindAdData();
                SendDeviceData();

                //2016-06-29 遇到上述deviceready run太多，才再檢查一次
                //第一次10秒後RUN
                if (isMarqueeFirstTime == true) {
                    BindMarqueeText();
                    isMarqueeFirstTime = false;
                }

                BindIconItem(1);
                BindIconItem(2);
            }
        }, 1000);



        function ssidHandler(s) {
            apName = s;
        }

        function ssidFail(e) {
            if (alertIsShow == false) {
                CustomAlert("Failed" + e);
            }
        }

        if (window.localStorage.BedId) {
            PatientBedId = window.localStorage.BedId;
        }

        $('.marquee').bind('finished', function () {
            $(this).marquee('pasue');
            BindMarqueeText();
        });


        $('#ADBlock').bind('click', function () {
            var iPath = $('#ADBlock').attr('src');
            var iAction;
            var iResult;
            var iId;
            if (ADContent != undefined) {
                if (ADContent.length > 0) {
                    //ADContent = response.split("|");
                    for (var xi = 0; xi < ADContent.length; xi++) {
                        if (ADContent[xi].split(',')[0].toString() == iPath.replace('http://122.117.67.226:5388/AdUpload/', '')) {
                            iAction = ADContent[xi].split(',')[1].toString();
                            iResult = ADContent[xi].split(',')[2].toString();
                            iId = ADContent[xi].split(',')[3].toString();
                            break;
                        }
                    }
                }

                if (iAction == "1") {
                    var NavigateRef = window.open(iResult, '_self', 'location=yes');
                } else {
                    ExcuteCheck(iResult);
                }

                UpdateAdCount(iId);
            }
        });


        $('#BedId').bind('click', function () {
            console.log("BedId Click Event");
            BedIdTouchCount++;
            //bc magic 7
            if (BedIdTouchCount >= 7) {
                BedIdTouchCount = 0;
                window.navigator.notification.prompt(
                  "請輸入系統控制碼",
                  function (ClientAnswer) {
                      if (ClientAnswer.buttonIndex === 1) {
                          var newCommand = ClientAnswer.input1;
                          ProcessClientCommand(newCommand);
                      } else {
                          //取消進入管理介面

                      }
                  },
                  "邦城系統前端管理介面",
                  ["確定", "取消"],
                  ""
                );
            }
        });

        console.log("執行BindPatient by OnDeviceReady:" + PatientBedId);
        BindPatientInformation(PatientBedId);

        $('#PayState').text(ConvertPayStatus());

        CheckIsTryEnd();
        CheckIsRealUsingEnd();

        //1280*672
        //CustomAlert(window.innerWidth + ":" + window.innerHeight);

        function GetUIdSuccess(uuid) {
            //CustomAlert(uuid + ":" + device.uuid + ":" + device.version + ":" + device.platform + ":" + device.model + ":" + cordova.platformId);
            DeviceId = uuid;
            CheckIsBind();
        };

        function GetUIdFail(errMsg) {
            if (alertIsShow == false) {
                CustomAlert("無法取得Device UId");
            }
        }

        function onBatteryStatus(status) {
            //console.log("Level: " + status.level + " isPlugged: " + status.isPlugged);
            batteryCount = status.level;
            batteryPlugin = status.isPlugged;

            //CustomAlert("電量" + status.level + " AC電源" + status.isPlugged.toString());
        }

        function BindApplication() {
            /** 2017-04-20*/
            console.log("呼叫BindApplication");
            console.log("myDeviceId:" + myDeviceId);
            /** 2017-04-20*/
            //var VVIP_Device = "19d1";
            //Device: VVIP_Device
            $.ajax({
                url: "http://122.117.67.226:5388/QueryApplication.aspx",
                type: "get",
                data: { SiteId: 1, DeviceId: myDeviceId },
                dataType: 'text',
                success: function (response) {
                    if (response.trim() == "") {
                        if (alertIsShow == false) {
                            CustomAlert("無法從院方Server取得應用程式資料");
                        }
                    } else {
                        //CustomAlert(response);
                        //return response;
                        var AllPackageName = "";
                        var tmpWhiteList = "whitelist";
                        ApplicationData = response.split("|");
                        console.log("ApplicationData->" + ApplicationData);

                        //SendAppLocation("whitelist" + response);

                        //CustomAlert(ApplicationData.length);
                        for (var j = 0; j < ApplicationData.length; j++) {
                            AllPackageName = ApplicationData[j].split(",")[2] + "|";
                            tmpWhiteList = tmpWhiteList + "|" + AllPackageName;
                            //console.log("tmpWhiteList->" + tmpWhiteList);

                            if (SearchPackageName(ApplicationData[j].split(",")[2]) == false) {
                                //CustomAlert("找不到到" + ApplicationData[j].split(",")[2]);
                                //CustomAlert("下載路徑:" + "http://122.117.67.226:5388/Upload/sign/" + ApplicationData[j].split(",")[1]);
                                //remoteFiles.push("http://122.117.67.226:5388/Upload/sign/" + ApplicationData[j].split(",")[1]);
                                //remoteFiles.pushIfNotExist("http://122.117.67.226:5388/Upload/sign/" + ApplicationData[j].split(",")[1]);

                                if (ApplicationData[j].split(",")[2] == "bc.ptcontent") {
                                    PushDownloadFile("http://122.117.67.226:5388/ContentIndex/ct.apk");
                                } else {
                                    /** 裝置Id*/
                                    if (OSVersion == "4.4.4") {
                                        PushDownloadFile("http://122.117.67.226:5388/Upload/sign/" + ApplicationData[j].split(",")[1]);
                                    } else {
                                        PushDownloadFile("http://122.117.67.226:5388/Upload/sign5/" + ApplicationData[j].split(",")[1]);
                                    }
                                }
                            } else {
                                //CustomAlert("有找到" + ApplicationData[j].split(",")[2]);
                            }
                        }

                        //SendWhiteList(AllPackageName);
                        SendAppLocation(tmpWhiteList);

                        if (remoteFiles !== undefined && remoteFiles.length > 0) {
                            //背景更新APP(電視盒不做更新)
                            //BackgroundDownload();
                        }
                    }
                },
                error: function (xhr) {
                    //Do Something to handle error
                    if (alertIsShow == false) {
                        CustomAlert("無法取得應用程式資料");
                    }

                }
            });
        };

        function ProcessClientCommand(pCommand) {
            if (pCommand.trim() == "") {
                if (alertIsShow == false) {
                    CustomAlert("控制碼為空，不進行任何動作");
                }
            } else {
                var CommandArray = pCommand.split(":");
                var CommandName = CommandArray[0];
                var CommandArgument = CommandArray[1];
                var CommandArgument2 = CommandArray[2];

                switch (CommandName.toString().toLowerCase()) {
                    case "staticwifi":

                        if (CommandArgument.toLowerCase() == "true") {
                            StaticWifi = true;
                        } else {
                            StaticWifi = false;
                        }

                        break;

                    case "bindbed":
                        console.log("執行BindPatient by ProcessClientrCommand:" + CommandArgument);
                        BindPatientInformation(CommandArgument);
                        //addBindLog(CommandArgument);
                        break;

                    case "currentbed":
                        CustomAlert(window.localStorage.BedId);
                        break;
                    case "connectwifi":
                        //WifiWizard.connectNetwork(SSID, win, fail);
                        var xObj = WifiWizard.formatWPAConfig(CommandArgument, CommandArgument2);
                        WifiWizard.addNetwork(xObj, function () { CustomAlert("新增網路設定成功"); }, function () { CustomAlert("無法新增網路設定"); });
                        WifiWizard.connectNetwork(CommandArgument, function () { CustomAlert("連接網路「" + CommandArgument + "」成功!"); }, function () { CustomAlert("無法連接網路「" + CommandArgument + "」!"); });
                        break;

                        //2017-07-28
                    case "connectwifi2":
                        var xObj = WifiWizard.formatWPA2Config(CommandArgument, CommandArgument2);
                        WifiWizard.addNetwork(xObj, function () { CustomAlert("新增網路設定成功"); }, function () { CustomAlert("無法新增網路設定"); });
                        WifiWizard.connectNetwork(CommandArgument, function () { CustomAlert("連接網路「" + CommandArgument + "」成功!"); }, function () { CustomAlert("無法連接網路「" + CommandArgument + "」!"); });
                        break;

                    case "wifion":
                        WifiWizard.setWifiEnabled(true, WifiSettingOK, WifiSettingFail);
                        break;

                    case "wifioff":
                        WifiWizard.setWifiEnabled(false, WifiSettingOK, WifiSettingFail);
                        break;

                    case "launcheron":
                        SendAppLocation("LockOn");
                        break;

                    case "launcheroff":
                        SendAppLocation("LockOff");
                        break;

                    case "getcontentindexversion":
                    case "ver":
                        if (alertIsShow == false) {
                            CustomAlert(ContentIndexCode);
                        }
                        break;

                        //以下為未來支援.........................................

                    case "currentlog":

                        break;

                    case "screenshot":
                        SendAppLocation("ScreenShot");
                        break;

                    case "closewebserver":
                        SendWebServer("closeServer");
                        break;

                    case "startwebserver":
                        window.plugins.launcher.launch({ packageName: "com.guo.duoduo.httpserver" }, successCallback, errorCallback);
                        break;

                        //以上為未來支援.........................................

                    case "debugon":
                        debugMode = true;
                        break;

                    case "debugoff":
                        debugMode = false;
                        break;

                        /** 裝置Id 功能 */
                    case "platform":
                        CustomAlert(device.platform);
                        break;

                    case "version":
                        CustomAlert(OSVersion);
                        break;
                        /** 裝置Id 功能 */

                    default:
                        if (alertIsShow == false) {
                            CustomAlert("找不到對應的系統指令");
                        }
                }
            }
        }
    };//end of onDeviceReady

    function HideName(uName) {
        var strlen = uName.length / 2;
        console.log("名字：" + (uName.toString().substring(strlen, strlen + 1)));
        return uName.toString().replace(uName.toString().substring(strlen, strlen + 1), "Ｏ");
    }

    function GetRealUsingDateTime(paraAcc, paraChar, paraName) {
        $.ajax({
            url: "http://122.117.67.226:5388/QueryRealUsing.aspx",
            type: "get",
            data: { QueryAcc: paraAcc, QueryChar: paraChar, QueryName: paraName },
            dataType: 'text',
            success: function (response) {
                if (response.trim() == "") {
                    if (alertIsShow == false) {
                        CustomAlert("無法從院方Server取得正式使用資料");
                    }
                } else {
                    WriteRealUsingText(response);
                    window.localStorage.RealUsingDateTime = response;
                }
            },
            error: function (xhr) {
                if (alertIsShow == false) {
                    CustomAlert("從院方Server取得正式使用資料");
                }
            }
        });
    }

    function CheckPatientStatus(pAcc, pChar, pName) {
        $.ajax({
            url: "http://122.117.67.226:5388/QueryPatientStatus.aspx",
            type: "get",
            data: { QueryAcc: pAcc, QueryChar: pChar, QueryName: pName },
            dataType: 'text',
            success: function (response) {
                if (response.trim() == "") {
                    if (alertIsShow == false) {
                        CustomAlert("無法從院方Server取得住院階段資料");
                    }
                } else {
                    PayStatus = parseInt(response.trim());
                    $('#PayState').text(ConvertPayStatus());

                    if (PayStatus == 3) {
                        GetRealUsingDateTime(pAcc, pChar, pName);
                    }

                    if (PayStatus == 1 || PayStatus == 3) {
                        //不需要顯示「提示收費」
                        confirmIsShow = false;
                    }

                }
            },
            error: function (xhr) {
                if (alertIsShow == false) {
                    CustomAlert("從院方Server取得住院階段資料");
                }
            }
        });
    };

    function LockUI() {
        $.blockUI({
            message: '設備已被鎖定!',
            onOverlayClick: UnlockUI
        });
    }

    function UnlockUI() {

        if (isUnlockShow == false) {
            isUnlockShow = true;
            window.navigator.notification.prompt(
                      "請輸入解鎖密碼",
                      function (ClientAnswer) {
                          if (ClientAnswer.buttonIndex === 1) {
                              var newCommand = ClientAnswer.input1;
                              if (newCommand == 'bcbs168') {
                                  $.unblockUI();
                                  isUnlockShow = false;
                              } else {
                                  //password incorrect
                                  isUnlockShow = false;
                              }
                          } else {
                              //取消進入管理介面
                              isUnlockShow = false;
                          }
                      },
                      "邦城系統前端管理介面(解鎖)",
                      ["確定", "取消"],
                      ""
                    );
        }
    }

    //2017-07-11
    //QueryBedInfo.aspx
    function BindPatientInformation(pPatientBedId) {
        /** 2017-04-20*/
        console.log("呼叫BindPatientInformation = " + pPatientBedId);
        /** 2017-04-20*/

        pPatientBedId = pPatientBedId.replace("bindbed:", "");
        console.log("proc = " + pPatientBedId);

        $.ajax({
            url: "http://122.117.67.226:5388/QueryBedInfo.aspx",
            type: "get",
            data: { BedId: pPatientBedId },
            dataType: 'text',
            success: function (response) {
                //如果成功呼叫(網路未斷線)，但沒有資料回來

                if (response.trim() == "") {
                    if (GetNetworkStatus() == true) {
                        //沒有病人資料(空房)
                        //$.blockUI({ message: '設備已被鎖定' });
                        //LockUI();

                        /*2017-07-28*/
                        emptyCounter++;
                        if (emptyCounter > 12) {
                            emptyCounter = 0;
                            LockUI();
                        }

                        $('#BedId').text('');
                        $('#PatientName').html('');
                        $('#DoctorName').text('');
                        $('#NurseName').text('');
                        //$.unblockUI();
                    }
                    if (alertIsShow == false) {
                        //CustomAlert("無法從院方的WebService中找到對應的病床資料");
                    }
                } else {
                    var PatientInforArray = response.split(",");
                    //CustomAlert(PatientInforArray[3]);
                    if (pPatientBedId.length > 4) {
                        var tmpBedId = pPatientBedId.replace('-', '');
                        //tmpBedId = tmpBedId.substring(0, pPatientBedId.length - 1) + "-" + pPatientBedId.charAt(pPatientBedId.length - 1);
                        //1651->1651-1
                        if (tmpBedId.length == 4) {
                            tmpBedId = tmpBedId + "-1";
                        }
                        //16511->1651-1
                        if (tmpBedId.length == 5) {
                            tmpBedId = tmpBedId.substring(0, pPatientBedId.length - 1) + "-" + pPatientBedId.charAt(pPatientBedId.length - 1);
                        }

                        $('#BedId').text(tmpBedId);
                    } else {
                        $('#BedId').text(pPatientBedId);
                    }

                    //$('#PatientName').text(PatientInforArray[1]);
                    //$('#PatientName').text(PatientInforArray[1].replace(/.(?=.)/g, '*'));
                    $('#PatientName').html(HideName(PatientInforArray[1]));

                    $('#DoctorName').text(PatientInforArray[2]);
                    $('#NurseName').text(PatientInforArray[3]);
                    $.unblockUI();
                    //2017-07-28
                    emptyCounter = 0;

                    accId = PatientInforArray[4];//住院序號
                    charId = PatientInforArray[5];//病歷號
                    patientFullName = PatientInforArray[1];
                    CheckPatientStatus(accId, charId, patientFullName);

                    //2017-09-18
                    //call intro
                    
                    if (window.localStorage.AccId) {
                        if (window.localStorage.AccId == accId) {

                        } else {
                            window.localStorage.AccId = accId;
                            window.plugins.launcher.launch({ packageName: 'com.example.xiang.intro' }, successCallback, errorCallback);
                        }
                    } else {
                        window.localStorage.AccId = accId;
                        window.plugins.launcher.launch({ packageName: 'com.example.xiang.intro' }, successCallback, errorCallback);
                    }
                    

                    PatientBedId = pPatientBedId;
                    window.localStorage.BedId = pPatientBedId;
                    addBindLog(pPatientBedId);
                }
            },
            error: function (xhr) {
                //Do Something to handle error
                if (alertIsShow == false) {
                    CustomAlert("無法取得病患資訊");
                }
                //無法取得也有可能是院方資料未更新這麼快
                //所以還是得顯示床號
                //$('#BedId').text(pPatientBedId);
                if (pPatientBedId.length > 4) {
                    var tmpBedId = pPatientBedId.replace('-', '');
                    tmpBedId = tmpBedId.substring(0, pPatientBedId.length - 1) + "-" + pPatientBedId.charAt(pPatientBedId.length - 1);
                    $('#BedId').text(tmpBedId);
                } else {
                    $('#BedId').text(pPatientBedId);
                }

                window.localStorage.BedId = pPatientBedId;
            }
        });
    }

    function SendBedId() {
        window.plugins.webintent.sendBroadcast({
            action: 'SendBedId',
            extras:
            {
                'BedId': PatientBedId.replace("-", "")
            }
        },
            function () { },
            function () {
                if (alertIsShow == false) {
                    CustomAlert('無法傳送參數');
                }
            }
            );
    }

    function SendAppLocation(pAppLocation) {
        window.plugins.webintent.sendBroadcast({
            action: 'SendAppLocation',
            extras:
            {
                'AppLocation': pAppLocation
            }
        },
            function () { },
            function () {
                if (alertIsShow == false) {
                    CustomAlert('無法傳送Apk安裝參數');
                }
            }
            );
    }

    function SendWebServer(pCmd) {
        window.plugins.webintent.sendBroadcast({
            action: 'SendEvent',
            extras:
            {
                'Event': pCmd
            }
        },
            function () { },
            function () {
                if (alertIsShow == false) {
                    CustomAlert('無法傳送HTTP SERVER 關閉參數');
                }
            }
            );
    }

    function SendWhiteList(pList) {
        window.plugins.webintent.sendBroadcast({
            action: 'SendWhiteList',
            extras:
            {
                'WhiteList': pList
            }
        },
            function () { },
            function () {
                if (alertIsShow == false) {
                    CustomAlert('無法傳送WhiteList');
                }
            }
            );
    }

    function WifiSettingOK() {
        showToast("Wifi設定成功");
    }

    function WifiSettingFail() {
        showToast("Wifi設定失敗");
    }

    function printObject(o) {
        var out = '';
        for (var p in o) {
            out += p + ': ' + o[p] + '\n';
        }
        if (alertIsShow == false) {
            CustomAlert(out);
        }
    }

    function showToast(pMessage) {
        window.plugins.toast.showWithOptions(
          {
              message: pMessage,
              duration: "short",
              position: "bottom",
              addPixelsY: -40
          }
        );
    }


    function ConvertPayStatus() {
        /*
        if (PayStatus == false) {
            return "未開通";
        } else {
            return "已開通";
        }*/

        //0->未開通 1->試用中  2->試用結束 3->已開通 4->開通結束

        var rText = '';

        switch (PayStatus) {
            case 0:
                rText = '未開通';
                break;

            case 1:
                rText = '試用中';
                break;

            case 2:
                rText = '試用結束';
                break;

            case 3:
                rText = '已開通';
                break;

            case 4:
                rText = '開通結束';
                break;

        }

        return rText;
    }

    function GetNetworkStatus() {
        if (navigator.network.connection.type == Connection.NONE) {
            return false;
        } else {
            return true;
        }
    }


    function downloadFile() {
        if (remoteFiles.length == 0) {
            return;
        }
        var remoteFile = remoteFiles.pop();
        var localFileName = remoteFile.substring(remoteFile.lastIndexOf('/') + 1);
        //CustomAlert("FileName->" + localFileName);
        //var localPath = cordova.file.dataDirectory;
        var localPath = cordova.file.externalRootDirectory;
        if (device.platform === "Android" && localPath.indexOf("file://") === 0) {
            localPath = localPath.substring(7);
            //CustomAlert("Path->" + localPath);
        }
        var ft = new FileTransfer();
        showToast("開始下載：" + localFileName);
        ft.download(remoteFile, localPath + localFileName, function (entry) {
            //CustomAlert("下載檔案成功"); 
            showToast(localFileName + "下載完成");
            SendAppLocation(localFileName);
            downloadFile();
        }, function () {
            if (alertIsShow == false) {
                CustomAlert("無法下載資料");
            }
        });

    }

    function BackgroundDownload() {
        if (remoteFiles.length == 0) {
            return;
        }

        var uriString = remoteFiles.pop();
        var fileName = uriString.substring(uriString.lastIndexOf('/') + 1);
        CURRENT_DOWNLOAD_FILE = fileName;
        //CustomAlert(fileName);

        window.resolveLocalFileSystemURL(cordova.file.externalRootDirectory, function (dirEntry) {

            dirEntry.getFile(fileName, {
                create: true,
                exclusive: false
            }, function (f) {

                //printObject(f);
                var downloader = new BackgroundTransfer.BackgroundDownloader();
                var download = downloader.createDownload(uriString, f);
                downloadPromise = download.startAsync().then(FileDownloadonSuccess, FileDownloadonError, FileDownloadonProgress);
                showToast("開始檔案下載工作...");
                showToast("下載路徑：" + uriString);

            }
                );
        }, function (e) {
            if (alertIsShow == false) {
                CustomAlert("無法存取下載資料夾...「" + e.code + "」");
            }
        });
    }

    function FileDownloadonProgress() {
        showToast("[" + CURRENT_DOWNLOAD_FILE + " ] 下載中...");
    }

    function FileDownloadonError() {
        showToast("[" + CURRENT_DOWNLOAD_FILE + "] 下載失敗...");
    }

    function FileDownloadonSuccess() {
        showToast("[" + CURRENT_DOWNLOAD_FILE + "] 下載成功...");
        SendAppLocation(CURRENT_DOWNLOAD_FILE);
        BackgroundDownload();
    }

    function onPause() {
        // TODO: 這個應用程式已暫停。請在這裡儲存應用程式狀態。
    };

    //呼叫RightMenu
    function GoHome() {
        window.plugins.webintent.sendBroadcast({
            action: 'SendRightMenu',
            extras:
            {
                'Process': 'pt-content'
            }
        },
         function () { },
         function () {
             if (alertIsShow == false) {
                 CustomAlert('無法傳送RightMenu參數');
             }
         }
      );
    }

    function onResume() {
        // TODO: 這個應用程式已重新啟動。請在這裡還原應用程式狀態。
        //CustomAlert("PTContent重新啟動");
        currentStep = "BC-Content-Index";
        GoHome();
        CheckIsTryEnd();
        CheckIsRealUsingEnd();
        //window.plugins.launcher.launch({ packageName: 'com.bc.rightmenu' }, successCallback, errorCallback);
    };

    //https://github.com/aamirafridi/jQuery.Marquee
    function BindMarqueeText() {
        $.ajax({
            url: "http://122.117.67.226:5388/QueryMarquee.aspx",
            type: "get",
            data: { SiteId: 1 },
            dataType: 'text',
            success: function (response) {
                if (response.trim() == "") {
                    if (alertIsShow == false) {
                        CustomAlert("無法從院方Server取得跑馬燈資料");
                    }
                } else {
                    //CustomAlert(response);
                    //return response;
                    MarqueeContent = response.split("|");
                    //CustomAlert(ApplicationData.length);
                    if (MarqueeCount >= MarqueeContent.length) {
                        MarqueeCount = 0;
                    }

                    var MarqueeText = MarqueeContent[MarqueeCount].split("$");

                    $('#TextShow').html(MarqueeText[0]);
                    $('.marquee').marquee({
                        duration: parseInt(MarqueeText[1]),
                        duplicated: false,
                        gap: 170
                    });
                    MarqueeCount++;
                }
            },
            error: function (xhr) {
                //Do Something to handle error
                if (alertIsShow == false) {
                    CustomAlert("無法取得跑馬燈資料");
                }

            }
        });
    }

    function ShowAdEffect() {
        $('#ADLayer').empty();
        var slider = new BeaverSlider({
            structure: {
                container: {
                    id: "ADLayer",
                    width: 710,
                    height: 318
                }
            },
            content: {
                images: [
                  ADData
                ]
            },
            animation: {
                effects: effectSets["slider: big set 2"],
                interval: 3000
            },

            events: {
                imageClick: function (e) {

                }
            }

        });

    }

    function BindAdData() {
        $.ajax({
            url: "http://122.117.67.226:5388/QueryAd.aspx",
            type: "get",
            data: { SiteId: 1 },
            dataType: 'text',
            success: function (response) {
                if (response.trim() == "") {
                    if (alertIsShow == false) {
                        CustomAlert("無法從院方Server取得廣告資料");
                    }
                } else {

                    ADContent = [];
                    ADData = [];

                    ADContent = response.split("|");
                    if (ADContent.length > 0) {
                        if (ADCount < ADContent.length) {
                            ADData.push("http://122.117.67.226:5388/AdUpload/" + ADContent[ADCount].split(",")[0]);
                            ADCount++;
                        } else {
                            ADCount = 0;
                            ADData.push("http://122.117.67.226:5388/AdUpload/" + ADContent[ADCount].split(",")[0]);
                        }

                    } else {
                        ADData.push("http://122.117.67.226:5388/AdUpload/ADBlock.png");
                    }

                    $('#ADBlock').fadeOut("slow", function () {
                        $('#ADBlock').attr('src', ADData[0]).fadeIn("slow");
                    });
                }
            },
            error: function (xhr) {
                if (alertIsShow == false) {
                    CustomAlert("無法取得廣告資料");
                }
            }
        });
    }
    
    //遙控器鍵盤點擊
    function keyFunction() {
        console.log("key Event = " + event.keyCode);
        if (event.keyCode == 119) {  //RII遙控器F8_Keycode = 119
            window.plugins.launcher.launch({ packageName: 'pu.tv' }, successCallback, errorCallback);
        }
        else if (event.keyCode == 120) {    //RII遙控器F9_Keycode = 120
            window.plugins.launcher.launch({ packageName: 'org.mozilla.firefox' }, successCallback, errorCallback);
        }
    }
    document.onkeydown = keyFunction;

    //新的網路無效後，連結原先的
    function ReConnectFineWifi() {
        WifiWizard.connectNetwork(apName, function () {
            CustomAlert("ReConnectFineWifi-連接網路「" + apName + "」成功![設定無效後]");
        }, function () {
            CustomAlert("ReConnectFineWifi-無法連接網路「" + apName + "」![設定無效後]");

        });
    }

    function ReConnectLastFineWifi() {
        /*
        if (LastFineWifi.trim() != '') {
            WifiWizard.connectNetwork(LastFineWifi, function () {
                CustomAlert("連接網路「" + LastFineWifi + "」成功![設定無效網路斷線後]");
            }, function () {
                CustomAlert("無法連接網路「" + LastFineWifi + "」![設定無效網路斷線後]");
            });
        }
        */
        /* 2017-07-31 LastFineWifi 一律為BC-BS */
        console.log("ReConnectLastFineWifi-開始重新連線網路");
        CustomAlert("ReConnectLastFineWifi-開始重新連線網路");

        var apNameInner = "BC-BS";
        apName = "BC-BS";
        LastFineWifi = apName;
        var apPassword = "@#$28844678";

        //2017-07-31 don't use wpa2, using wpa ok
        var xObj = WifiWizard.formatWPA2Config(apNameInner, apPassword);

        WifiWizard.addNetwork(xObj, function () {
            CustomAlert("ReConnectLastFineWifi-新增網路設定成功");
            console.log("ReConnectLastFineWifi-新增網路設定成功");
        },

        function () {
            CustomAlert("ReConnectLastFineWifi-無法新增網路設定");
            console.log("ReConnectLastFineWifi-無法新增網路設定");
        });

        WifiWizard.connectNetwork(apNameInner, function () {
            CustomAlert("連接網路「" + apNameInner + "」成功!");
        }, function (e) {
            console.log(e.toString());
            CustomAlert("無法連接網路「" + apNameInner + "」!");
            //ReConnectLastFineWifi();
        });
    }

    function GetWifiSetting() {
        $.ajax({
            url: "http://122.117.67.226:5388/WifiQuery.aspx",
            type: "get",
            data: { RoomId: PatientBedId, SiteId: 1 },
            dataType: 'text',
            success: function (response) {
                if (response.trim() == "") {
                    if (alertIsShow == false) {
                        CustomAlert("無法從院方Server取得Wifi設定");
                    }
                } else {

                    var WifiData = response.split("{wifi}");
                    if (WifiData.length > 0) {
                        var WifiName = WifiData[0].toString();
                        var WifiPassword = WifiData[1].toString();
                        apName = apName.replace(/\"/g, "");
                        console.log('GetWifiSetting-APName:' + apName);
                        console.log('GetWifiSetting-WifiName:' + WifiName);
                        if (apName.trim() != '') {
                            if (apName != WifiName) {
                                LastFineWifi = apName;
                                /*
                                  var xObj = WifiWizard.formatWPA2Config(CommandArgument, CommandArgument2);
                                  WifiWizard.addNetwork(xObj, function () { CustomAlert("新增網路設定成功"); }, function () { CustomAlert("無法新增網路設定"); });
                                  WifiWizard.connectNetwork(CommandArgument, function () { CustomAlert("連接網路「" + CommandArgument + "」成功!"); }, function () { CustomAlert("無法連接網路「" + CommandArgument + "」!"); });
                                */
                                var xObj = WifiWizard.formatWPA2Config(WifiName, WifiPassword);
                                WifiWizard.addNetwork(xObj, function () { CustomAlert("GetWifiSetting-新增網路設定成功"); }, function () { CustomAlert("GetWifiSetting-無法新增網路設定"); });
                                WifiWizard.connectNetwork(WifiName, function () {
                                    CustomAlert("GetWifiSetting-連接網路「" + WifiName + "」成功!");
                                }, function () {
                                    CustomAlert("GetWifiSetting-無法連接網路「" + WifiName + "」!");
                                    //ReConnectFineWifi();//2017-07-31
                                    ReConnectLastFineWifi();
                                });
                            }
                        }
                    }
                }
            },
            error: function (xhr) {

                ReConnectLastFineWifi();

                if (alertIsShow == false) {
                    CustomAlert("無法從院方Server取得Wifi設定");
                }
            }
        });
    }

    

    function GetExtName(pFile) {
        var extName = "";//副檔名

        var extIndex = pFile.lastIndexOf('.');
        if (extIndex != -1) {
            extName = pFile.substr(extIndex + 1, pFile.length);
            //console.log(extName);
        }

        return extName;
    }

    function BindIconItem(pArea) {
        ClearTableContent();
        $.ajax({
            url: "http://122.117.67.226:5388/IconItemQuery.aspx",
            type: "get",
            data: { Area: pArea },
            dataType: 'text',
            success: function (response) {
                if (response.trim() == "") {
                    if (alertIsShow == false) {
                        CustomAlert("無法從院方Server取得IconItem");
                    }
                } else {
                    var ItemData = response.split("@");
                    for (var i = 0; i < ItemData.length - 1; i++) {
                        var CategoryName = ItemData[i].split("$")[0];
                        var CategoryImage = ItemData[i].split("$")[1];
                        var CategoryId = ItemData[i].split("$")[2];


                        if (pArea == 1) {

                            if (ItemData.length > 6) {
                                myScroll1.destroy();
                                myScroll1 = null;
                                myScroll1 = new iScroll('wrapper1', { hScroll: false, vScroll: true, hScrollbar: false, vScrollbar: true });
                            }

                            $("#LeftTable td").each(function (index) {
                                if ($(this).html().trim() == '') {
                                    var newImg = "<img id='" + CategoryImage + "' src='http://122.117.67.226:5388/CategoryImage" + "/" + CategoryImage + "' class='Icon' /><br/>";
                                    var newSpan = "<span class='NormalColor1' >" + CategoryName + "</>";
                                    $(this).append(newImg);
                                    $(this).append(newSpan);

                                    $(this).bind('click', { cText: CategoryName, cId: CategoryId }, function (event) {
                                        var data = event.data;
                                        if (GetNetworkStatus() == true) {
                                            var category1Count = GetAppCategoryCount(data.cId);
                                            if (category1Count > 1) {
                                                $('#Modal').show();
                                                $('#ModalSpan').html(data.cText);
                                                $('#ModalSpan').show();
                                                $('#ModalImage').show();
                                                isModalShow = true;
                                                BindApplicationModal(data.cId);
                                            } else {
                                                if (category1Count > 0 && isModalShow == false) {
                                                    var runPackage1 = GetAppCategoryOnly(data.cId);
                                                    currentStep = runPackage1;
                                                    //window.plugins.launcher.launch({ packageName: runPackage1 }, successCallback, errorCallback);
                                                    ExcuteCheck(currentStep);
                                                } else {
                                                    if (alertIsShow == false && isModalShow == false) {
                                                        CustomAlert("很抱歉，目前此類別中沒有任何服務的App");
                                                    }
                                                }
                                            }
                                        } else {
                                            if (alertIsShow == false) {
                                                CustomAlert("無網路狀連線，請洽服務人員");
                                            }
                                        }
                                    });

                                    return false;
                                }
                            });
                        }
                        if (pArea == 2) {
                            if (ItemData.length > 6) {
                                myScroll2.destroy();
                                myScroll2 = null;
                                myScroll2 = new iScroll('wrapper2', { hScroll: false, vScroll: true, hScrollbar: false, vScrollbar: true });
                            }
                            $("#RightTable td").each(function (index) {
                                if ($(this).html().trim() == '') {
                                    var newImg = "<img id='" + CategoryImage + "' src='http://122.117.67.226:5388/CategoryImage" + "/" + CategoryImage + "' class='Icon' /><br/>";
                                    var newSpan = "<span class='NormalColor1' >" + CategoryName + "</>";
                                    $(this).append(newImg);
                                    $(this).append(newSpan);

                                    $(this).bind('click', { cText: CategoryName, cId: CategoryId }, function (event) {
                                        var data = event.data;
                                        if (GetNetworkStatus() == true) {
                                            var category1Count = GetAppCategoryCount(data.cId);
                                            if (category1Count > 1) {
                                                $('#Modal').show();
                                                $('#ModalSpan').html(data.cText);
                                                $('#ModalSpan').show();
                                                $('#ModalImage').show();
                                                isModalShow = true;
                                                BindApplicationModal(data.cId);
                                            } else {
                                                if (category1Count > 0 && isModalShow == false) {
                                                    var runPackage1 = GetAppCategoryOnly(data.cId);
                                                    currentStep = runPackage1;
                                                    //window.plugins.launcher.launch({ packageName: runPackage1 }, successCallback, errorCallback);
                                                    ExcuteCheck(currentStep);
                                                } else {
                                                    if (alertIsShow == false && isModalShow == false) {
                                                        CustomAlert("很抱歉，目前此類別中沒有任何服務的App");
                                                    }
                                                }
                                            }
                                        } else {
                                            if (alertIsShow == false) {
                                                CustomAlert("無網路狀連線，請洽服務人員");
                                            }
                                        }
                                    });

                                    return false;
                                }
                            });
                        }
                    }
                }
            },
            error: function (xhr) {
                if (alertIsShow == false) {
                    CustomAlert("無法取得取得IconItem");
                }

            }
        });
    };

    function PushDownloadFile(filePath) {
        var found = jQuery.inArray(filePath, remoteFiles);
        if (found >= 0) {
            //filters.splice(found, 1);
            /*2017-07-30*/
            console.log("已有相同的檔案下載中...");
        } else {

            remoteFiles.push(filePath);
        }
    }

    function UpdateAdCount(AdId) {
        $.ajax({
            url: "http://122.117.67.226:5388/UpdateAdClick.aspx",
            type: "get",
            data: { Id: AdId },
            dataType: 'text',
            success: function (response) {
                if (response.trim() == "") {
                    if (alertIsShow == false) {
                        CustomAlert("無法成功更新廣告點擊率...");
                    }
                } else {

                }
            },
            error: function (xhr) {
                if (alertIsShow == false) {
                    CustomAlert("無法更新廣告點擊率...");
                }

            }
        });
    }

    function WriteTryText(cDateTime) {
        console.log("窵入試用結束時間" + cDateTime);
        var path = cordova.file.externalRootDirectory;
        window.resolveLocalFileSystemURI(path, function (dir) {
            dir.getFile("TryLog.txt", { create: true }, function (file) {
                tryLog = file;
                writeTryLog(cDateTime);
            });
        }, function () {

        });
    }

    function writeTryLog(cDateTime) {
        if (!tryLog) return;
        var log = cDateTime;

        tryLog.createWriter(function (fileWriter) {
            var blob = new Blob([log], { type: 'text/plain' });
            fileWriter.write(blob);
        }, function () {

        });
    }

    function WriteRealUsingText(cDateTime) {
        console.log("窵入正式結束時間" + cDateTime);
        var path = cordova.file.externalRootDirectory;
        window.resolveLocalFileSystemURI(path, function (dir) {
            dir.getFile("RealUsingLog.txt", { create: true }, function (file) {
                RealUsingLog = file;
                writeRealUsingLog(cDateTime);
            });
        }, function () {

        });
    }

    function writeRealUsingLog(cDateTime) {
        if (!RealUsingLog) return;
        var log = cDateTime;

        RealUsingLog.createWriter(function (fileWriter) {
            var blob = new Blob([log], { type: 'text/plain' });
            fileWriter.write(blob);
        }, function () {

        });
    }

    function UpdatePayStatus(pStatus) {
        $.ajax({
            url: "http://122.117.67.226:5388/UpdatePayStatus.aspx",
            type: "get",
            data: { QueryAcc: accId, QueryChar: charId, NewStatus: pStatus, QueryName: patientFullName },
            dataType: 'text',
            success: function (response) {
                if (response.trim() == "") {
                    if (alertIsShow == false) {
                        CustomAlert("無法成功更新付費狀態...");
                    }
                } else {

                    if (response.trim() == "Empty") {

                    } else if (response.trim() == "Error") {

                    } else {
                        //Get Try Hour 而且是剛從未啟用改為試用
                        //開始試用
                        if (pStatus == 1) {
                            WriteTryText(response);
                            window.localStorage.TryDateTime = response;
                        }
                    }
                }
            },
            error: function (xhr) {
                if (alertIsShow == false) {
                    CustomAlert("更新付費狀態時發生錯誤...");
                }
            }
        });
    }

    function SendDeviceData() {

        $.ajax({
            url: "http://122.117.67.226:5388/WriteDeviceData.aspx",
            type: "get",
            data: { SiteId: 1, AndroidId: DeviceId, BedId: PatientBedId, SysStep: currentStep, IPAddress: ipAddress, WifiName: apName, BatteryCount: batteryCount, BatteryPlugin: batteryPlugin.toString() },
            dataType: 'text',
            success: function (response) {
                if (response.trim() == "") {
                    if (alertIsShow == false) {
                        CustomAlert("SendDeviceData-無法成功寫入裝置資料...");
                    }
                } else {

                }
            },
            error: function (xhr) {
                //Do Something to handle error
                if (alertIsShow == false) {
                    CustomAlert("SendDeviceData-on error-無法寫入裝置資料...");
                }

            }
        });
    };

    function SendClickData(packName) {

        $.ajax({
            url: "http://122.117.67.226:5388/WriteDeviceData.aspx",
            type: "get",
            data: { SiteId: 1, AndroidId: DeviceId, BedId: PatientBedId, SysStep: packName, IPAddress: ipAddress, WifiName: apName, BatteryCount: batteryCount, BatteryPlugin: batteryPlugin.toString() },
            dataType: 'text',
            success: function (response) {
                if (response.trim() == "") {
                    if (alertIsShow == false) {
                        CustomAlert("SendClickData-無法成功寫入裝置資料...");
                    }
                } else {

                }
            },
            error: function (xhr) {
                //Do Something to handle error
                if (alertIsShow == false) {
                    CustomAlert("SendClickData-on error-無法寫入裝置資料...");
                }

            }
        });
    };

    function GetDeviceInfo() {

        /** 裝置Id功能 */
        /** 2017-04-20 */
        console.log("執行GetDeviceInfo");
        var deviceOS = device.platform;
        OSVersion = device.version;
        console.log("Device OS:" + OSVersion);//4.4.4
        console.log("Device Platform:" + deviceOS);//Android
        /** 2017-04-20 */

        $.ajax({
            url: "http://122.117.67.226:5388/QueryDevice.aspx",
            type: "get",
            data: { Platform: deviceOS, Version: OSVersion },
            dataType: 'text',
            success: function (response) {
                if (response.trim() == "") {
                    if (alertIsShow == false) {
                        CustomAlert("無法成功取得裝置Id...");
                    }
                } else {
                    myDeviceId = response.trim();
                    console.log("裝置Id:" + myDeviceId);
                }
            },
            error: function (xhr) {
                if (alertIsShow == false) {
                    CustomAlert("無法取得裝置Id資料...");
                }
            }
        });
    };

    function GetHospitalData() {
        /** 2017-04-20*/
        console.log("呼叫GetHospitalData");
        /** 2017-04-20*/
        $.ajax({
            url: "http://122.117.67.226:5388/QueryHospital.aspx",
            type: "get",
            data: { Id: 1 },
            dataType: 'text',
            success: function (response) {
                if (response.trim() == "") {
                    if (alertIsShow == false) {
                        CustomAlert("無法成功取得付費文字和鎖定文字...");
                    }
                } else {
                    NeedPayText = response.split("^*^")[0];
                    DeviceLockText = response.split("^*^")[1];
                }
            },
            error: function (xhr) {
                if (alertIsShow == false) {
                    CustomAlert("無法取得資料...");
                }
            }
        });
    };

    function GetInstallListSuccess(obj) {
        InstallData = obj;
        /*
        for (var i = 0; i < obj.length;i++)
        {
            CustomAlert(obj[i].package);
        }
        */
    }

    function GetInstallListFail() {
        //無法取得已安裝程式資料
    }

    function SearchPackageName(pPackage) {
        if (InstallData !== undefined) {
            var bResult = false;
            //CustomAlert(InstallData);

            for (var i = 0; i < InstallData.length; i++) {
                //console.log("I:" + InstallData[i].package + ":::" + pPackage);

                if (InstallData[i].package == pPackage) {

                    if (GetPackageVersionCode(pPackage) > InstallData[i].vcode) {
                        bResult = false;
                    } else {
                        bResult = true;
                    }
                    break;
                }
            }
            return bResult;
        }
    }

    function CheckPackageNameNeedPay(pPackage) {
        if (ApplicationData !== undefined && ApplicationData.length > 0) {
            var bResult = false;

            for (var i = 0; i < ApplicationData.length; i++) {

                if (ApplicationData[i].split(",")[2] == pPackage) {
                    //bResult = true;
                    if (ApplicationData[i].split(",")[6].toString() == "True") {
                        return true;
                    } else {
                        return false;
                    }
                    break;
                }
            }
            return bResult;
        }
        return false;
    }

    function GetPackageVersionCode(pPackage) {
        if (ApplicationData !== undefined && ApplicationData.length > 0) {

            for (var i = 0; i < ApplicationData.length; i++) {
                if (ApplicationData[i].split(",")[2] == pPackage) {
                    return ApplicationData[i].split(",")[5];
                    break;
                }
            }
        }
    }

    function CheckPackageNameIsEnable(pPackage) {
        if (ApplicationData !== undefined && ApplicationData.length > 0) {
            var bResult = false;

            for (var i = 0; i < ApplicationData.length; i++) {

                if (ApplicationData[i].split(",")[2] == pPackage) {

                    if (ApplicationData[i].split(",")[7].toString() == "True") {
                        return true;
                    } else {
                        return false;
                    }
                    break;
                }
            }
            return bResult;
        }
        return false;
    }

    function GetAppCategoryCount(pCategory) {
        var rCount = 0;
        for (var j = 0; j < ApplicationData.length; j++) {
            if (ApplicationData[j].split(",")[3] == pCategory) {
                rCount++;
            }
        }
        return rCount;
    }

    function GetAppCategoryOnly(pCategory) {
        var rPackageName = "";

        for (var j = 0; j < ApplicationData.length; j++) {
            if (ApplicationData[j].split(",")[3] == pCategory) {
                rPackageName = ApplicationData[j].split(",")[2];
                break;
            }
        }
        return rPackageName;
    }

    function ClearTD() {
        $("#ApplicationTable td").each(function (index) {
            $(this).unbind("click");//2016-06-30之前少加，會有bug
            $(this).html("");
        });
    }

    function ClearTableContent() {
        /** 2017-04-20*/
        console.log("呼叫ClearTableContent");
        /** 2017-04-20*/

        $("#LeftTable td").each(function (index) {
            $(this).unbind("click");
            $(this).html("");
        });

        $("#RightTable td").each(function (index) {
            $(this).unbind("click");
            $(this).html("");
        });
    }

    function BindApplicationModal(pCategory) {

        /** 2017-04-20*/
        console.log("呼叫BindApplicationModal");
        /** 2017-04-20*/

        var rName = "";
        var rPackName = "";
        var rImageName = "";
        var rAPKFileName = "";
        var doCount = -1;

        ClearTD();

        for (var j = 0; j < ApplicationData.length; j++) {
            if (ApplicationData[j].split(",")[3] == pCategory) {
                rName = ApplicationData[j].split(",")[0];
                rAPKFileName = ApplicationData[j].split(",")[1];
                rPackName = ApplicationData[j].split(",")[2];
                rImageName = ApplicationData[j].split(",")[4];
                //CustomAlert(rName +":" + rImageName);
                doCount++;
                $("#ApplicationTable td").each(function (index) {
                    if (doCount == index) {
                        var newImg = "<img id='" + rPackName + "' class='popupService' src='" + "http://122.117.67.226:5388/ApkImage/" + rImageName + "' weight='100px' height='100px' /><br/>";
                        if (rImageName.trim() == "") {
                            newImg = "<img id='" + rPackName + "' class='popupService' src='" + "http://122.117.67.226:5388/ApkImage/" + rAPKFileName.replace(".apk", ".png") + "' weight='100px' height='100px' /><br/>";
                        }
                        var newSpan = "<span class='NormalColor' >" + rName + "</>";

                        $('<input>').attr({
                            type: 'hidden',
                            value: rPackName
                        }).appendTo($(this));

                        /*必須先unbind，不然點好幾次，會出現好幾個alert window*/
                        $(this).unbind("click");

                        $(this).append(newImg);
                        $(this).append(newSpan);
                        $(this).bind('click', function (e) {
                            //CustomAlert(e.originalEvent.toElement.id);
                            currentStep = e.originalEvent.toElement.id;

                            if (ApplicationData.length > 0) {

                                if (CheckPackageNameIsEnable(currentStep) == true) {
                                    if (CheckPackageNameNeedPay(currentStep) == true) {
                                        //CustomAlert("要收費!");
                                        if (confirmIsShow == false) {
                                            if (PayStatus == 0 || PayStatus == 2 || PayStatus == 4) {
                                                CustomConfirm(NeedPayText, currentStep);
                                            } else {
                                                if (PayStatus == 1 || PayStatus == 3) {
                                                    window.plugins.launcher.launch({ packageName: currentStep }, successCallback, errorCallback);
                                                }
                                            }
                                        }
                                    } else {
                                        window.plugins.launcher.launch({ packageName: currentStep }, successCallback, errorCallback);
                                    }

                                } else {
                                    if (alertIsShow == false) {
                                        CustomAlert("程式尚未啟用，請洽服務人員...");
                                    }

                                }
                            }
                        });
                        return;
                    }
                });
            }//END IF
        }//END FOR
    }

    var successCallback = function (data) {
        //開啟應用程式成功
    };
    var errorCallback = function (errMsg) {
        if (alertIsShow == false) {
            CustomAlert("無法開啟應用程式，請洽服務人員 「" + errMsg + "」");
        }
    };

    function DoCheckUpdate() {
        GetDeviceInfo();
        GetHospitalData();
        installedApps.getPackages(GetInstallListSuccess, GetInstallListFail);
        //BindApplication();
        //BindIconItem(1);
        //BindIconItem(2);
        console.log("執行BindPatient by DoCheckUpdate:" + PatientBedId);
        BindPatientInformation(PatientBedId);
    }

    function NetworkOffline() {
        showToast("網路已斷線");
    }

    function NetworkOnline() {
        showToast("網路已連線");
        console.log("執行BindPatient by NetworkOnline:" + window.localStorage.BedId);
        BindPatientInformation(window.localStorage.BedId);
    }

    function alertDismissed() {
        alertIsShow = false;
    }

    function CustomAlert(pMessage) {
        if (alertIsShow == false && debugMode == true) {
            alertIsShow = true;
            navigator.notification.alert(
                pMessage,
                alertDismissed(),
                '注意',
                '確定'
            );
        }
    }

    function ExcuteCheck(pPackage) {
        if (ApplicationData.length > 0) {

            if (CheckPackageNameIsEnable(pPackage) == true) {

                //2018-03-05
                SendClickData(pPackage);

                if (CheckPackageNameNeedPay(pPackage) == true) {
                    //CustomAlert("要收費!");
                    if (PayStatus == 0 || PayStatus == 2) {
                        CustomConfirm(NeedPayText, pPackage);
                    } else {
                        if (isModalShow == true) {
                            $('#Modal').hide();
                            $('#ModalImage').hide();
                            $('#ModalSpan').hide();
                            isModalShow = false;
                        }

                        /*2017-07-30*/
                        console.log("加入紀錄時間:" + GetDateTime());
                        tapHistory.push(pPackage + "," + GetDateTime());

                        window.plugins.launcher.launch({ packageName: pPackage }, successCallback, errorCallback);

                    }
                } else {
                    if (isModalShow == true) {
                        $('#Modal').hide();
                        $('#ModalImage').hide();
                        $('#ModalSpan').hide();
                        isModalShow = false;
                    }

                    /*2017-07-30*/
                    console.log("加入紀錄時間:" + GetDateTime());
                    tapHistory.push(pPackage + "," + GetDateTime());

                    window.plugins.launcher.launch({ packageName: pPackage }, successCallback, errorCallback);
                }

            } else {
                if (alertIsShow == false) {
                    CustomAlert("程式尚未啟用，請洽服務人員...");
                }
            }
        }
    }

    function CustomConfirm(pMessage, pPackage) {
        confirmIsShow = true;
        navigator.notification.confirm(
           pMessage,
            function onConfirm(buttonIndex) {
                //alert('選擇? ' + buttonIndex);
                if (buttonIndex == 2) {
                    //return false;
                    confirmIsShow = false;
                    return;
                } else if (buttonIndex == 1) {

                    if (PayStatus == 0) {
                        PayStatus = 1;
                        $('#PayState').text(ConvertPayStatus());
                        UpdatePayStatus(PayStatus);

                        confirmIsShow = false;
                        if (isModalShow == true) {
                            $('#Modal').hide();
                            $('#ModalImage').hide();
                            $('#ModalSpan').hide();
                            isModalShow = false;
                        }
                        window.plugins.launcher.launch({ packageName: pPackage }, successCallback, errorCallback);
                        return;
                    }
                } else {
                    confirmIsShow = false;
                }
            },
           '請您注意並確認',
           ['確定', '取消']
       );
    }

    function GetDateTime() {
        var currentdate = new Date();
        var datetime = "Last Sync: " + currentdate.getDate() + "/"
                        + (currentdate.getMonth() + 1) + "/"
                        + currentdate.getFullYear() + " @ "
                        + currentdate.getHours() + ":"
                        + currentdate.getMinutes() + ":"
                        + currentdate.getSeconds();
        return datetime;
    }


})();