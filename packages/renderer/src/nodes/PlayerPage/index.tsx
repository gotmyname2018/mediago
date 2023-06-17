import React, { FC, useEffect, useRef, useState } from "react";
import Player from "xgplayer";
import "xgplayer/dist/index.min.css";
import "./index.scss";
import axios from "axios";
import { useAsyncEffect, useRequest, useToggle } from "ahooks";
import { List, Space, Button } from "antd";
import useElectron from "../../hooks/electron";

interface Video {
  id: number;
  url: string;
  name: string;
}

const { getLocalIP } = useElectron();
const localIP = getLocalIP();
const port =
  import.meta.env.NODE_ENV === "development"
    ? import.meta.env.APP_SERVER_PORT
    : 8556;
const videoList = `http://${localIP}:${port}/api/video-list`;
// 获取视频列表
const getVideoList = async (): Promise<Video[]> =>
  axios.get(videoList).then((res) => res.data);

// 播放器页面
const PlayerPage: FC = () => {
  const { rendererEvent, removeEventListener } = useElectron();
  const [showVideoList, { toggle }] = useToggle();
  const [showButton, setShowButton] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);
  const player = useRef<Player>();
  const { data: videoList, refresh } = useRequest(getVideoList);
  const playedVideoId = useRef<number>();

  useAsyncEffect(async () => {
    if (!playerRef.current) return;
    if (!Array.isArray(videoList) || !videoList.length) return;
    if (player.current) return;

    let src = videoList[0].url;
    if (playedVideoId.current) {
      const video = videoList.find((item) => item.id === playedVideoId.current);
      if (video) {
        src = video.url;
      }
    }

    player.current = new Player({
      el: playerRef.current,
      videoInit: true,
      fluid: true,
      keyShortcut: true,
      url: src,
      playNext: {
        urlList: videoList.map((item) => item.url),
      },
    });
  }, [videoList]);

  // 打开播放器窗口的时候播放的视频id
  const openPlayerWindow = (e: any, videoId: number) => {
    playedVideoId.current = videoId;

    if (!player.current) return;

    const vc = videoList?.find((item) => item.id === videoId)?.url || "";
    player.current.src = vc;
  };

  useEffect(() => {
    rendererEvent("open-player-window", openPlayerWindow);

    return () => {
      removeEventListener("open-player-window", openPlayerWindow);
    };
  }, []);

  return (
    <div className="player-page">
      <div
        className="video-container"
        onMouseEnter={() => {
          setShowButton(true);
        }}
        onMouseLeave={() => {
          setShowButton(false);
        }}
      >
        {!showVideoList && showButton && (
          <div className="list-toggle">
            <Button onClick={toggle}>展开</Button>
          </div>
        )}
        <div ref={playerRef} />
      </div>
      {showVideoList && (
        <div className="video-list">
          <List
            header={
              <Space.Compact block>
                <Button onClick={refresh}>刷新</Button>
                <Button onClick={toggle}>收起</Button>
              </Space.Compact>
            }
            dataSource={videoList}
            renderItem={(item) => (
              <List.Item
                onClick={() => {
                  if (!player.current) return;
                  player.current.src = item.url;
                }}
                title={item.name}
                className="video-list-item"
              >
                {item.name}
              </List.Item>
            )}
          />
        </div>
      )}
    </div>
  );
};

export default PlayerPage;