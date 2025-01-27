import { cn } from "@/utils";
import React, { ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { DownloadStatus } from "@/types";
import { Progress, Space } from "antd";
import { PauseCircleOutlined, PlayCircleOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { selectAppStore } from "@/store";
import selectedBg from "@/assets/images/select-item-bg.png";
import DownloadForm from "@/components/DownloadForm";
import {
  CloseIcon,
  DownloadIcon,
  DownloadListIcon,
  EditIcon,
  FailedIcon,
  PauseIcon,
  TerminalIcon,
} from "@/assets/svg";
import useElectron from "@/hooks/electron";
import { DownloadTag } from "@/components/DownloadTag";
import { IconButton } from "@/components/IconButton";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
import Terminal from "@/components/DownloadTerminal";

interface Props {
  item: DownloadItem;
  onSelectChange: (id: number) => void;
  selected: boolean;
  onStartDownload: (id: number) => void;
  onStopDownload: (item: number) => void;
  onConfirmEdit: (
    values: DownloadItem,
    downloadNow?: boolean,
  ) => Promise<boolean>;
  onContextMenu: (item: number) => void;
  progress?: DownloadProgress;
}

export function DownloadItem({
  item,
  onSelectChange,
  selected,
  onStartDownload,
  onStopDownload,
  onConfirmEdit,
  onContextMenu,
  progress,
}: Props) {
  const appStore = useSelector(selectAppStore);
  const { t } = useTranslation();
  const { openPlayerWindow } = useElectron();

  const renderTerminalBtn = (item: DownloadItem) => {
    if (!appStore.showTerminal) return null;

    return (
      <Drawer handleOnly>
        <DrawerTrigger>
          <IconButton
            key="terminal"
            title={t("terminal")}
            icon={<TerminalIcon fill="#707070" />}
          />
        </DrawerTrigger>
        <DrawerContent>
          <Terminal
            header={
              <div className="flex flex-shrink-0 flex-row items-center justify-between">
                {item.name}
                <DrawerClose>
                  <IconButton icon={<CloseIcon />} />
                </DrawerClose>
              </div>
            }
            className="h-[350px] overflow-hidden px-3"
            id={item.id}
            log={item.log}
          />
        </DrawerContent>
      </Drawer>
    );
  };
  // 编辑表单
  const renderEditForm = (item: DownloadItem) => {
    return (
      <DownloadForm
        key={"edit"}
        isEdit
        item={item}
        trigger={<IconButton title={t("edit")} icon={<EditIcon />} />}
        onAddToList={(values) => onConfirmEdit(values)}
        onDownloadNow={(values) => onConfirmEdit(values, true)}
      />
    );
  };
  const renderActionButtons = (item: DownloadItem): ReactNode => {
    if (item.status === DownloadStatus.Ready) {
      return [
        renderTerminalBtn(item),
        renderEditForm(item),
        <IconButton
          key="download"
          icon={<DownloadListIcon />}
          title={t("download")}
          onClick={() => onStartDownload(item.id)}
        />,
      ];
    }
    if (item.status === DownloadStatus.Downloading) {
      return [
        renderTerminalBtn(item),
        <IconButton
          key="stop"
          title={t("pause")}
          icon={<PauseCircleOutlined />}
          onClick={() => onStopDownload(item.id)}
        />,
      ];
    }
    if (item.status === DownloadStatus.Failed) {
      return [
        renderTerminalBtn(item),
        renderEditForm(item),
        <IconButton
          key="redownload"
          title={t("redownload")}
          icon={<DownloadListIcon />}
          onClick={() => onStartDownload(item.id)}
        />,
      ];
    }
    if (item.status === DownloadStatus.Watting) {
      return [t("watting")];
    }
    if (item.status === DownloadStatus.Stopped) {
      return [
        renderTerminalBtn(item),
        renderEditForm(item),
        <IconButton
          key="restart"
          icon={<DownloadListIcon />}
          title={t("continueDownload")}
          onClick={() => onStartDownload(item.id)}
        />,
      ];
    }

    // 下载成功
    return [
      <IconButton
        key={"play"}
        icon={<PlayCircleOutlined />}
        title={t("playVideo")}
        onClick={() => openPlayerWindow()}
      />,
    ];
  };

  const renderTitle = (item: DownloadItem): ReactNode => {
    let tag = null;
    if (item.status === DownloadStatus.Downloading) {
      tag = (
        <DownloadTag
          icon={<DownloadIcon />}
          text={t("downloading")}
          color="#127af3"
        />
      );
    } else if (item.status === DownloadStatus.Success) {
      tag = <DownloadTag text={t("downloadSuccess")} color="#09ce87" />;
    } else if (item.status === DownloadStatus.Failed) {
      tag = (
        <DownloadTag
          icon={<FailedIcon />}
          text={t("downloadFailed")}
          color="#ff7373"
        />
      );
    } else if (item.status === DownloadStatus.Stopped) {
      tag = (
        <DownloadTag
          icon={<PauseIcon />}
          text={t("downloadPause")}
          color="#9abbe2"
        />
      );
    }

    return (
      <div className="flex flex-row gap-2">
        <div
          className={cn("text-sm dark:text-[#B4B4B4]", {
            "text-[#127af3]": selected,
          })}
        >
          {item.name}
        </div>
        {item.isLive && (
          <DownloadTag text={t("liveResource")} color="#9abbe2" />
        )}
        {tag}
      </div>
    );
  };

  const renderDescription = (item: DownloadItem): ReactNode => {
    if (progress) {
      const { percent, speed } = progress;

      return (
        <Space.Compact className="download-progress description" block>
          <Progress
            percent={Math.round(Number(percent))}
            strokeLinecap="butt"
          />
          <div className="progress-speed">{speed}</div>
        </Space.Compact>
      );
    }
    return (
      <div
        className="relative truncate text-xs text-[#B3B3B3] dark:text-[#515257]"
        title={item.url}
      >
        {item.url}
      </div>
    );
  };

  return (
    <div
      className={cn(
        "relative flex flex-row gap-3 rounded-lg bg-[#FAFCFF] px-3 pb-3.5 pt-2 dark:bg-[#27292F]",
        {
          "bg-gradient-to-r from-[#D0E8FF] to-[#F2F7FF] dark:from-[#27292F] dark:to-[#00244E]":
            selected,
        },
      )}
      onContextMenu={() => onContextMenu(item.id)}
    >
      <Checkbox
        className="mt-2"
        checked={selected}
        onCheckedChange={() => onSelectChange(item.id)}
      />
      <div className={cn("flex flex-1 flex-col gap-1 overflow-hidden")}>
        {selected && (
          <img
            src={selectedBg}
            className="absolute bottom-0 right-[126px] top-0 block h-full select-none"
          />
        )}
        <div className="relative flex flex-row items-center justify-between">
          {renderTitle(item)}
          <div className="flex flex-row items-center gap-5 rounded-2xl rounded-r-lg bg-white px-4 py-1 dark:bg-[#3B3F48]">
            {renderActionButtons(item)}
          </div>
        </div>
        {renderDescription(item)}
      </div>
    </div>
  );
}
